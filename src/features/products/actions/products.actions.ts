"use server";

import { actionClient } from '@/lib/safe-action';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireTenantContext } from '@/lib/db/tenant';
import { ProductRepository } from '../repositories/products.repository';
import { createAuditEntry } from '@/features/audit/services/audit.service';
import { revalidatePath } from 'next/cache';

export const productSchema = z.object({
  description: z.string().max(500).optional().nullable(),
  name: z.string().min(1, 'El nombre es obligatorio'),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  stockQuantity: z.number().int().default(0),
  minStock: z.number().int().default(0),
  costPrice: z.string().optional().nullable(),
  salePrice: z.string().optional().nullable(),
  trackingMode: z.enum(['sku', 'serial']).default('sku'),
  imageUrl: z.string().url().optional().nullable(),
  metadata: z.any().optional(),
});

export const productUpdateSchema = productSchema.partial().extend({
  id: z.string().uuid(),
});

export const createProductAction = actionClient
  .schema(productSchema)
  .action(async ({ parsedInput }) => {
    const { tenantId, userId } = await requireTenantContext();
    const repo = new ProductRepository(db, tenantId);

    const dataToInsert = {
      ...parsedInput,
      description: parsedInput.description || null,
      sku: parsedInput.sku || null,
      barcode: parsedInput.barcode || null,
      categoryId: parsedInput.categoryId || null,
      costPrice: parsedInput.costPrice || null,
      salePrice: parsedInput.salePrice || null,
      imageUrl: parsedInput.imageUrl || null,
      metadata: parsedInput.metadata ?? {},
    };

    const newProduct = await repo.create(dataToInsert);

    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: 'product.created',
      entityType: 'product',
      entityId: newProduct.id,
      after: newProduct,
    });

    revalidatePath('/products');
    return newProduct;
  });

export const updateProductAction = actionClient
  .schema(productUpdateSchema)
  .action(async ({ parsedInput }) => {
    const { tenantId, userId } = await requireTenantContext();
    const repo = new ProductRepository(db, tenantId);
    const { id, ...dataToUpdate } = parsedInput;

    const oldProduct = await repo.getById(id);
    if (!oldProduct) {
      throw new Error('Producto no encontrado');
    }

    const cleanData = {
      ...dataToUpdate,
      description: dataToUpdate.description || null,
      sku: dataToUpdate.sku || null,
      barcode: dataToUpdate.barcode || null,
      categoryId: dataToUpdate.categoryId || null,
      costPrice: dataToUpdate.costPrice || null,
      salePrice: dataToUpdate.salePrice || null,
      imageUrl: dataToUpdate.imageUrl || null,
      metadata: dataToUpdate.metadata ?? oldProduct.metadata,
    };

    const updated = await repo.update(id, cleanData as any);

    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: 'product.updated',
      entityType: 'product',
      entityId: id,
      before: oldProduct,
      after: updated,
    });

    revalidatePath('/products');
    return updated;
  });
