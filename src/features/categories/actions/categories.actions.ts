"use server";

import { actionClient } from '@/lib/safe-action';
import { db } from '@/lib/db';
import { requireTenantContext } from '@/lib/db/tenant';
import { CategoryRepository } from '../repositories/categories.repository';
import { createAuditEntry } from '@/features/audit/services/audit.service';
import { revalidatePath } from 'next/cache';
import { categorySchema, deleteCategorySchema } from '../schemas/category.schema';

export const createCategoryAction = actionClient
  .schema(categorySchema)
  .action(async ({ parsedInput }) => {
    const { tenantId, userId } = await requireTenantContext();
    const repo = new CategoryRepository(db, tenantId);

    const newCategory = await repo.create({
      name: parsedInput.name,
      color: parsedInput.color || '#cccccc',
    });

    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: 'category.created',
      entityType: 'category',
      entityId: newCategory.id,
      after: newCategory,
    });

    revalidatePath('/categories');
    return newCategory;
  });

export const deleteCategoryAction = actionClient
  .schema(deleteCategorySchema)
  .action(async ({ parsedInput }) => {
    const { tenantId, userId } = await requireTenantContext();
    const repo = new CategoryRepository(db, tenantId);

    const deleted = await repo.delete(parsedInput.id);

    if (deleted) {
      await createAuditEntry({
        db,
        tenantId,
        clerkUserId: userId,
        action: 'category.deleted',
        entityType: 'category',
        entityId: deleted.id,
        before: deleted,
      });
    }

    revalidatePath('/categories');
    return deleted;
  });
