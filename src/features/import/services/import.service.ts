import * as XLSX from "xlsx";

import {
  autoDetectField,
  getFieldLabel,
  getHeaderDisplayLabel,
  getFieldSection,
  MAIN_IMPORT_FIELDS,
  type MainImportField,
  type ImportableField,
} from "@/features/import/config/column-synonyms";
import { type ImportPreviewRow, validateImportRow } from "@/features/import/validators/import.validator";

export type ParsedImportFile = {
  fileName: string;
  rowCount: number;
  headers: string[];
  rows: Record<string, string>[];
  matches: Record<string, ImportableField>;
};

function sanitizeCellValue(value: string | undefined) {
  return (value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function normalizeIsbn(value: string | undefined) {
  return sanitizeCellValue(value).replace(/[-\s]/g, "");
}

function buildFingerprint(values: {
  title?: string;
  author?: string;
  sku?: string;
  publisher?: string;
  classification?: string;
}) {
  return [values.title, values.sku, values.author, values.publisher, values.classification]
    .map((value) => sanitizeCellValue(value).toLowerCase())
    .filter(Boolean)
    .join("::");
}

function appendNote(lines: string[], label: string, value: string | undefined) {
  const normalized = sanitizeCellValue(value);
  if (!normalized) return;
  lines.push(`${label}: ${normalized}`);
}

function getStockSource(headers: string[], matches: Record<string, ImportableField>) {
  const source = headers.find((header) => matches[header] === "stock_quantity");
  return source || null;
}

export async function parseSpreadsheet(file: File): Promise<ParsedImportFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string | number | null>>(firstSheet, {
    defval: "",
  });
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return {
    fileName: file.name,
    rowCount: rows.length,
    headers,
    rows: rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key, value == null ? "" : sanitizeCellValue(String(value))]),
      ),
    ),
    matches: Object.fromEntries(
      headers
        .map((header) => [header, autoDetectField(header)] as const)
        .filter(([, field]) => field !== "ignore"),
    ) as Record<string, ImportableField>,
  };
}

export function getMatchedHeaders(parsedFile: ParsedImportFile) {
  return Object.entries(parsedFile.matches)
    .filter(([, field]) => getFieldSection(field) === "main")
    .map(([header, field]) => ({
      header,
      field,
      label: getFieldLabel(field),
      sourceLabel: getHeaderDisplayLabel(header),
    }));
}

export function getMainFieldAssignments(parsedFile: ParsedImportFile) {
  return MAIN_IMPORT_FIELDS.map((field) => {
    const detectedEntry = Object.entries(parsedFile.matches).find(([, matchedField]) => matchedField === field);
    return {
      field,
      label: getFieldLabel(field),
      detectedHeader: detectedEntry?.[0] ?? "",
      detectedLabel: detectedEntry ? getHeaderDisplayLabel(detectedEntry[0]) : "",
    };
  });
}

export function getHeaderOptions(parsedFile: ParsedImportFile) {
  return parsedFile.headers.map((header) => ({
    header,
    label: getHeaderDisplayLabel(header),
  }));
}

export function getRemainingHeaders(
  parsedFile: ParsedImportFile,
  assignedHeaders: string[],
) {
  const assigned = new Set(assignedHeaders.filter(Boolean));
  return getHeaderOptions(parsedFile).filter(({ header }) => !assigned.has(header));
}

export function buildPreviewRows({
  rows,
  mainAssignments,
  secondaryHeaders,
  filterHeaders = [],
}: {
  rows: Record<string, string>[];
  mainAssignments: Partial<Record<MainImportField, string>>;
  secondaryHeaders: string[];
  filterHeaders?: string[];
}) {
  const groups = new Map<string, ImportPreviewRow>();
  const stockSource = mainAssignments.stock_quantity || null;
  const titleSource = mainAssignments.title || null;
  const authorSource = mainAssignments.author || null;
  const isbnSource = mainAssignments.isbn || null;
  const skuSource = mainAssignments.sku || null;
  const categorySource = mainAssignments.category || null;
  const publisherSource = secondaryHeaders.find((header) => autoDetectField(header) === "additional_publisher");
  const classificationSource = secondaryHeaders.find((header) => autoDetectField(header) === "facet_clasificacion");

  rows.forEach((row, index) => {
    const title = titleSource ? sanitizeCellValue(row[titleSource]) : "";
    const author = authorSource ? sanitizeCellValue(row[authorSource]) : "";
    const isbn = isbnSource ? normalizeIsbn(row[isbnSource]) : "";
    const sku = skuSource ? sanitizeCellValue(row[skuSource]) : "";
    const category = categorySource ? sanitizeCellValue(row[categorySource]) : "";
    const publisher = publisherSource ? sanitizeCellValue(row[publisherSource]) : "";
    const classification = classificationSource ? sanitizeCellValue(row[classificationSource]) : "";

    const stockQuantity = stockSource ? Math.max(1, Number(sanitizeCellValue(row[stockSource]) || 1)) : 1;
    const key = isbn || buildFingerprint({ title, sku, author, publisher, classification }) || `row-${index + 1}`;

    const metadataValues = Object.fromEntries(
      secondaryHeaders
        .map((header) => [header, sanitizeCellValue(row[header])])
        .filter(([, value]) => value),
    ) as Record<string, string>;

    const noteLines: string[] = [];
    for (const [label, value] of Object.entries(metadataValues)) {
      appendNote(noteLines, label, value);
    }

    const existing = groups.get(key);
    if (existing) {
      existing.rowNumbers.push(index + 1);
      existing.stockQuantity += stockQuantity;
      if (!existing.author && author) existing.author = author;
      if (!existing.isbn && isbn) existing.isbn = isbn;
      if (!existing.sku && sku) existing.sku = sku;
      if (!existing.category && category) existing.category = category;
      existing.notes = [existing.notes, noteLines.join("\n")].filter(Boolean).join("\n");
      existing.metadata = { ...existing.metadata, ...metadataValues };
      existing.filters = {
        ...existing.filters,
        ...Object.fromEntries(
          filterHeaders.map((header) => [header, sanitizeCellValue(row[header])]).filter(([, value]) => value),
        ),
      };
      return;
    }

    const preview: ImportPreviewRow = {
      key,
      rowNumbers: [index + 1],
      title,
      author: author || undefined,
      isbn: isbn || undefined,
      sku: sku || undefined,
      stockQuantity,
      category: category || undefined,
      notes: noteLines.join("\n"),
      facets: {},
      metadata: metadataValues,
      filters: Object.fromEntries(
        filterHeaders.map((header) => [header, sanitizeCellValue(row[header])]).filter(([, value]) => value),
      ) as Record<string, string>,
      errors: [],
    };

    preview.errors = validateImportRow(preview);
    groups.set(key, preview);
  });

  return [...groups.values()].map((row) => ({
    ...row,
    errors: validateImportRow(row),
  }));
}
