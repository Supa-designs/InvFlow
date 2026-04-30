export type ImportPreviewRow = {
  key: string;
  rowNumbers: number[];
  title: string;
  author?: string;
  isbn?: string;
  sku?: string;
  stockQuantity: number;
  category?: string;
  notes: string;
  facets: Record<string, string>;
  metadata: Record<string, string>;
  filters: Record<string, string>;
  errors: string[];
};

export function validateImportRow(row: ImportPreviewRow) {
  const errors: string[] = [];

  if (!row.title.trim()) {
    errors.push("El título es obligatorio");
  }

  if (row.stockQuantity < 1) {
    errors.push("La cantidad mínima de ejemplares es 1");
  }

  return errors;
}
