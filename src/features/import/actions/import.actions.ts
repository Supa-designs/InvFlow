"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { requireTenantContext } from "@/lib/db/tenant";
import { db } from "@/lib/db";
import { ProductRepository } from "@/features/products/repositories/products.repository";
import { CategoryRepository } from "@/features/categories/repositories/categories.repository";
import { createAuditEntry } from "@/features/audit/services/audit.service";

const importRowSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().int().min(1).default(1),
  minStock: z.number().int().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  publisher: z.string().optional(),
  year: z.string().optional(),
  pages: z.string().optional(),
  costPrice: z.string().optional(),
  salePrice: z.string().optional(),
});

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
    const categories = await categoryRepo.getAll();
    const categoryMap = new Map(categories.map((category) => [category.name.toLowerCase(), category.id]));

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      if (!row.title.trim()) {
        skipped += 1;
        continue;
      }

      let categoryId: string | null = null;
      if (row.category?.trim()) {
        const key = row.category.trim().toLowerCase();
        categoryId = categoryMap.get(key) ?? null;
        if (!categoryId) {
          const createdCategory = await categoryRepo.create({
            name: row.category.trim(),
            color: '#3b82f6',
          });
          categoryMap.set(key, createdCategory.id);
          categoryId = createdCategory.id;
        }
      }

      const normalizedIsbn = row.isbn?.replace(/[-\s]/g, '') || null;
      const quantity = Math.max(1, row.stockQuantity);

      const metadata = {
        isbn: normalizedIsbn,
        author: row.author || null,
        thumbnail: normalizedIsbn
          ? `https://covers.openlibrary.org/b/isbn/${normalizedIsbn}-M.jpg`
          : null,
        notes: row.notes || null,
        publisher: row.publisher || null,
        year: row.year || null,
        pages: row.pages || null,
        copies: {
          available: quantity,
          loaned: 0,
          lost: 0,
          damaged: 0,
        },
      };

      await productRepo.create({
        name: row.title,
        description: row.notes || null,
        sku: row.sku || null,
        barcode: normalizedIsbn,
        categoryId,
        stockQuantity: quantity,
        minStock: row.minStock ?? 0,
        costPrice: row.costPrice || null,
        salePrice: row.salePrice || null,
        metadata,
        trackingMode: 'sku',
        isActive: true,
      });

      imported += 1;
    }

    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: 'import.completed',
      entityType: 'import',
      after: { imported, skipped },
    });

    return { imported, skipped };
  });
