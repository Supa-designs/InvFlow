"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import { ProductRepository } from "@/features/products/repositories/products.repository";
import { MovementRepository } from "@/features/movements/repositories/movements.repository";
import { createAuditEntry } from "@/features/audit/services/audit.service";
import { db } from "@/lib/db";
import { requireTenantContext } from "@/lib/db/tenant";

export const lookupProductByBarcodeAction = actionClient
  .schema(z.object({ barcode: z.string().min(1) }))
  .action(async ({ parsedInput: { barcode } }) => {
    const { tenantId } = await requireTenantContext();
    const repo = new ProductRepository(db, tenantId);

    const product = (await repo.getByBarcode(barcode)) ?? (await repo.getBySKU(barcode));
    return product;
  });

export const addQuickMovementAction = actionClient
  .schema(
    z.object({
      productId: z.string().uuid(),
      type: z.enum(["entry", "exit"]),
      quantity: z.number().int().positive(),
      notes: z.string().optional(),
    })
  )
  .action(async ({ parsedInput: { productId, type, quantity, notes } }) => {
    const { tenantId, userId } = await requireTenantContext();
    const productRepo = new ProductRepository(db, tenantId);
    const movementRepo = new MovementRepository(db, tenantId);
    // Get current product state
    const product = await productRepo.getById(productId);
    if (!product) throw new Error("Product not found");

    // Compute new stock
    const newStock =
      type === "entry"
        ? (product.stockQuantity || 0) + quantity
        : Math.max(0, (product.stockQuantity || 0) - quantity);

    // Save movement
    await movementRepo.create({
      productId,
      type: type === 'entry' ? 'in' : type === 'exit' ? 'out' : 'adjustment',
      quantity,
      quantityBefore: product.stockQuantity || 0,
      quantityAfter: newStock,
      clerkUserId: userId,
      notes: notes || "Quick scan movement",
    });

    // Update product stock
    const updatedProduct = await productRepo.update(productId, {
      stockQuantity: newStock,
    });

    // Log the transaction
    await createAuditEntry({
      db,
      tenantId,
      clerkUserId: userId,
      action: "create",
      entityType: "movement",
      entityId: product.id,
      before: { stockQuantity: product.stockQuantity },
      after: { stockQuantity: newStock, movementType: type, quantity },
    });

    return { product: updatedProduct, movementType: type, newStock };
  });
