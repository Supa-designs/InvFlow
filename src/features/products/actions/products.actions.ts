"use server";

import { z } from "zod";

import { actionClient } from '@/lib/safe-action';
import { db } from '@/lib/db';
import { requireTenantContext } from '@/lib/db/tenant';
import { ProductRepository } from '../repositories/products.repository';
import { createAuditEntry } from '@/features/audit/services/audit.service';
import { revalidatePath } from 'next/cache';
import { productSchema, productUpdateSchema } from '../schemas/product.schema';
import { invalidateTenantProductCache } from '../services/products-cache.service';

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

    await invalidateTenantProductCache(tenantId);
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

    await invalidateTenantProductCache(tenantId);
    revalidatePath('/products');
    return updated;
  });

export const deleteProductAction = actionClient
  .schema(z.object({ id: z.string().uuid() }))
  .action(async ({ parsedInput }) => {
    const { tenantId, userId } = await requireTenantContext();
    const repo = new ProductRepository(db, tenantId);

    const existing = await repo.getById(parsedInput.id);
    if (!existing) {
      throw new Error('Producto no encontrado');
    }

    const deleted = await repo.delete(parsedInput.id);

    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: 'product.deleted',
      entityType: 'product',
      entityId: parsedInput.id,
      before: existing,
      after: deleted,
    });

    await invalidateTenantProductCache(tenantId);
    revalidatePath('/products');
    return deleted;
  });
