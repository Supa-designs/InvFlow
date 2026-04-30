import { z } from "zod";

export const productSchema = z.object({
  description: z.string().max(500).optional().nullable(),
  name: z.string().min(1, "El nombre es obligatorio"),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  stockQuantity: z.number().int().default(0),
  minStock: z.number().int().default(0),
  costPrice: z.string().optional().nullable(),
  salePrice: z.string().optional().nullable(),
  trackingMode: z.enum(["sku", "serial"]).default("sku"),
  imageUrl: z.string().url().optional().nullable(),
  metadata: z.any().optional(),
});

export const productUpdateSchema = productSchema.partial().extend({
  id: z.string().uuid(),
});
