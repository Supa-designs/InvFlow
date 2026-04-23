export type ImportPreviewRow = {
  rowNumber: number;
  values: Record<string, string>;
  title: string;
  author?: string;
  isbn?: string;
  sku?: string;
  stockQuantity: number;
  minStock?: number;
  category?: string;
  notes?: string;
  publisher?: string;
  year?: string;
  pages?: string;
  costPrice?: string;
  salePrice?: string;
  errors: string[];
};

export function validateImportRow(row: ImportPreviewRow) {
  const errors: string[] = [];

  if (!row.title.trim()) {
    errors.push('El título es obligatorio');
  }

  if (row.stockQuantity < 1) {
    errors.push('La cantidad mínima de ejemplares es 1');
  }

  return errors;
}
