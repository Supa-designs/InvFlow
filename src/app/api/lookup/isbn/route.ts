import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';

// Initialize Redis if URL and Token are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isbn = searchParams.get("q");

  if (!isbn || isbn.length < 10) {
    return NextResponse.json({ error: "Invalid ISBN format" }, { status: 400 });
  }

  const cacheKey = `isbn:${isbn}`;

  try {
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return NextResponse.json({ ...cached, source: 'cache' });
      }
    }

    const openLibraryResponse = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
      { next: { revalidate: 60 * 60 * 24 * 30 } },
    );
    const openLibraryData = await openLibraryResponse.json();
    const openLibraryBook = openLibraryData[`ISBN:${isbn}`];

    let result:
      | {
          title: string;
          authors: string;
          publishers: string;
          publish_date: string;
          pages: number | null;
          cover: string | null;
          year: string;
          source: string;
        }
      | null = null;

    if (openLibraryBook) {
      result = {
        title: openLibraryBook.title || "",
        authors: openLibraryBook.authors?.map((author: { name: string }) => author.name).join(", ") || "",
        publishers: openLibraryBook.publishers?.map((publisher: { name: string }) => publisher.name).join(", ") || "",
        publish_date: openLibraryBook.publish_date || "",
        pages: openLibraryBook.number_of_pages || null,
        cover:
          openLibraryBook.cover?.medium ||
          openLibraryBook.cover?.large ||
          openLibraryBook.cover?.small ||
          null,
        year: openLibraryBook.publish_date || "",
        source: 'openlibrary',
      };
    } else {
      const googleBooksResponse = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
        { next: { revalidate: 60 * 60 * 24 * 30 } },
      );
      const googleBooksData = await googleBooksResponse.json();
      const firstItem = googleBooksData.items?.[0]?.volumeInfo;

      if (firstItem) {
        result = {
          title: firstItem.title || "",
          authors: firstItem.authors?.join(", ") || "",
          publishers: firstItem.publisher || "",
          publish_date: firstItem.publishedDate || "",
          pages: firstItem.pageCount || null,
          cover:
            firstItem.imageLinks?.thumbnail ||
            firstItem.imageLinks?.smallThumbnail ||
            null,
          year: firstItem.publishedDate || "",
          source: 'google-books',
        };
      }
    }

    if (!result) {
      return NextResponse.json({ error: "No data found for this ISBN" }, { status: 404 });
    }

    if (redis) {
      await redis.set(cacheKey, result, { ex: 60 * 60 * 24 * 30 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error looking up ISBN:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
