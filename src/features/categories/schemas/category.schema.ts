import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  color: z
    .union([
      z.literal(""),
      z.string().regex(/^#[0-9a-fA-F]{6}$/i, "Formato hexadecimal inválido"),
    ])
    .optional()
    .nullable(),
});

export const deleteCategorySchema = z.object({
  id: z.string().uuid(),
});
