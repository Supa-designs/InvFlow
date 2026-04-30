"use server";

import { z } from "zod";

import { createAuditEntry } from "@/features/audit/services/audit.service";
import { CategoryRepository } from "@/features/categories/repositories/categories.repository";
import { ProductRepository } from "@/features/products/repositories/products.repository";
import { invalidateTenantProductCache } from "@/features/products/services/products-cache.service";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/db/tenant";
import { actionClient } from "@/lib/safe-action";
import { products } from "@/lib/db/schema/tenant/products";

const importRowSchema = z.object({
  key: z.string().min(1),
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().int().min(1).default(1),
  category: z.string().optional(),
  notes: z.string().optional(),
  facets: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  filters: z.record(z.string(), z.string()).optional(),
});

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() || "";
}

function normalizeIsbn(value?: string) {
  return value?.replace(/[-\s]/g, "") || "";
}

function buildFingerprint(input: {
  title?: string;
  author?: string;
  sku?: string;
  classification?: string;
}) {
  return [input.title, input.sku, input.author, input.classification]
    .map(normalizeText)
    .filter(Boolean)
    .join("::");
}

export const importProductsAction = actionClient
  .schema(
    z.object({
      rows: z.array(importRowSchema),
    }),
  )
  .action(async ({ parsedInput: { rows } }) => {
    const { tenantId, userId } = await requireTenantContext();
    const productRepo = new ProductRepository(db, tenantId);
    const categoryRepo = new CategoryRepository(db, tenantId);

    const [categories, existingProducts] = await Promise.all([
      categoryRepo.getAll(),
      productRepo.getAll(),
    ]);

    const categoryMap = new Map(categories.map((category) => [category.name.toLowerCase(), category]));
    const isbnMap = new Map<string, (typeof existingProducts)[number]>();
    const fingerprintMap = new Map<string, (typeof existingProducts)[number]>();

    for (const product of existingProducts) {
      const metadata = (product.metadata ?? {}) as Record<string, any>;
      const normalizedBarcode = normalizeIsbn(product.barcode || metadata.isbn);
      if (normalizedBarcode) isbnMap.set(normalizedBarcode, product);

      const fingerprint = buildFingerprint({
        title: product.name,
        author: metadata.author,
        classification: metadata.facets?.Clasificación || metadata.facets?.clasificacion,
      });
      if (fingerprint) fingerprintMap.set(fingerprint, product);
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const pendingCreates: Array<Omit<typeof products.$inferInsert, "tenantId">> = [];

    for (const row of rows) {
      if (!row.title.trim()) {
        skipped += 1;
        continue;
      }

      const normalizedIsbn = normalizeIsbn(row.isbn);
    const fingerprint = buildFingerprint({
      title: row.title,
      sku: row.sku,
      author: row.author,
      classification: row.facets?.Clasificación || row.facets?.clasificacion,
    });

      const exists = normalizedIsbn
        ? isbnMap.has(normalizedIsbn)
        : fingerprintMap.has(fingerprint);

      if (exists) {
        skipped += 1;
        continue;
      }

      let categoryId: string | null = null;
      if (row.category?.trim()) {
        const key = row.category.trim().toLowerCase();
        const existingCategory = categoryMap.get(key);
        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          const createdCategory = await categoryRepo.create({
            name: row.category.trim(),
            color: "#3b82f6",
          });
          categoryMap.set(key, createdCategory);
          categoryId = createdCategory.id;
        }
      }

      const metadata = {
        isbn: normalizedIsbn || null,
        author: row.author || null,
        facets: row.facets ?? {},
        filters: row.filters ?? {},
        importedFields: row.metadata ?? {},
        notes: row.notes || null,
        thumbnail: normalizedIsbn
          ? `https://covers.openlibrary.org/b/isbn/${normalizedIsbn}-M.jpg`
          : null,
        copies: {
          available: row.stockQuantity,
          loaned: 0,
          lost: 0,
          damaged: 0,
        },
      };

      pendingCreates.push({
        name: row.title,
        description: row.notes || null,
        sku: row.sku || null,
        barcode: normalizedIsbn || null,
        categoryId,
        stockQuantity: row.stockQuantity,
        minStock: 0,
        costPrice: null,
        salePrice: null,
        metadata,
        trackingMode: "sku",
        isActive: true,
      });
    }

    const batchSize = 250;
    const insertedProducts = [];
    for (let index = 0; index < pendingCreates.length; index += batchSize) {
      const batch = pendingCreates.slice(index, index + batchSize);
      const inserted = await productRepo.createMany(batch);
      insertedProducts.push(...inserted);
    }

    imported = insertedProducts.length;
    for (const created of insertedProducts) {
      const normalizedBarcode = normalizeIsbn(created.barcode || (created.metadata as Record<string, any> | undefined)?.isbn || undefined);
      const fingerprint = buildFingerprint({
        title: created.name,
        sku: created.sku || undefined,
        author: (created.metadata as Record<string, any> | undefined)?.author,
        classification:
          (created.metadata as Record<string, any> | undefined)?.facets?.Clasificación ||
          (created.metadata as Record<string, any> | undefined)?.facets?.clasificacion,
      });
      if (normalizedBarcode) isbnMap.set(normalizedBarcode, created);
      if (fingerprint) fingerprintMap.set(fingerprint, created);
    }

    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: "import.appended",
      entityType: "import",
      after: { imported, updated, skipped, mode: "append", titles: imported },
    });

    await invalidateTenantProductCache(tenantId);

    return { imported, updated, skipped };
  });
