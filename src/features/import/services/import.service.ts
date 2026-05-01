import * as XLSX from 'xlsx';
import { autoDetectField, type ImportableField } from '@/features/import/config/column-synonyms';
import { type ImportPreviewRow, validateImportRow } from '@/features/import/validators/import.validator';

export type ParsedImportFile = {
  fileName: string;
  rowCount: number;
  headers: string[];
  rows: Record<string, string>[];
  mapping: Record<string, ImportableField | 'ignore'>;
};

export async function parseSpreadsheet(file: File): Promise<ParsedImportFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(firstSheet, {
    defval: '',
  });

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    fileName: file.name,
    rowCount: rows.length,
    headers,
    rows: rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value == null ? '' : String(value)]),
      ),
    ),
    mapping: Object.fromEntries(headers.map((header) => [header, autoDetectField(header)])),
  };
}

export function buildPreviewRows(
  rows: Record<string, string>[],
  mapping: Record<string, ImportableField | 'ignore'>,
) {
  return rows.map((row, index) => {
    const preview: ImportPreviewRow = {
      rowNumber: index + 1,
      values: row,
      title: '',
      stockQuantity: 1,
      errors: [],
    };

    for (const [sourceColumn, targetField] of Object.entries(mapping)) {
      if (targetField === 'ignore') continue;
      const value = row[sourceColumn]?.trim() ?? '';

      switch (targetField) {
        case 'title':
          preview.title = value;
          break;
        case 'author':
          preview.author = value;
          break;
        case 'isbn':
          preview.isbn = value;
          break;
        case 'sku':
          preview.sku = value;
          break;
        case 'stock_quantity':
          preview.stockQuantity = Math.max(1, Number(value || 1));
          break;
        case 'min_stock':
          preview.minStock = Number(value || 0);
          break;
        case 'category':
          preview.category = value;
          break;
        case 'notes':
          preview.notes = value;
          break;
        case 'publisher':
          preview.publisher = value;
          break;
        case 'year':
          preview.year = value;
          break;
        case 'pages':
          preview.pages = value;
          break;
        case 'cost_price':
          preview.costPrice = value;
          break;
        case 'sale_price':
          preview.salePrice = value;
          break;
      }
    }

    preview.errors = validateImportRow(preview);
    return preview;
  });
}
