"use client";

import { useMemo, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/features/import/components/FileUpload";
import { ColumnMapper } from "@/features/import/components/ColumnMapper";
import { ImportPreview } from "@/features/import/components/ImportPreview";
import { ImportResult } from "@/features/import/components/ImportResult";
import { importProductsAction } from "@/features/import/actions/import.actions";
import { parseSpreadsheet, buildPreviewRows, type ParsedImportFile } from "@/features/import/services/import.service";
import type { ImportableField } from "@/features/import/config/column-synonyms";
import { toast } from "sonner";

export function ImportPanel() {
  const [parsedFile, setParsedFile] = useState<ParsedImportFile | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const previewRows = useMemo(() => {
    if (!parsedFile) return [];
    return buildPreviewRows(parsedFile.rows, parsedFile.mapping);
  }, [parsedFile]);

  const duplicateTargets = useMemo(() => {
    if (!parsedFile) return [];
    const used = Object.values(parsedFile.mapping).filter((value) => value !== 'ignore');
    return used.filter((value, index) => used.indexOf(value) !== index);
  }, [parsedFile]);

  const importAction = useAction(importProductsAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setResult(data);
      toast.success("Importación completada");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "No se pudo completar la importación");
    },
  });

  async function handleFileSelected(file: File) {
    try {
      setResult(null);
      setParsedFile(await parseSpreadsheet(file));
    } catch (error) {
      toast.error("No se pudo leer el archivo");
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Importar datos</h2>
        <p className="text-sm text-muted-foreground">
          Carga un archivo y revisa el mapeo de columnas antes de importar.
        </p>
      </div>

      <FileUpload onFileSelected={handleFileSelected} />

      {parsedFile ? (
        <>
          <div className="rounded-xl border bg-muted px-4 py-3 text-sm">
            Archivo: <span className="font-medium">{parsedFile.fileName}</span> · Filas detectadas:{" "}
            <span className="font-medium">{parsedFile.rowCount}</span>
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Mapeo de columnas</h3>
            <ColumnMapper
              headers={parsedFile.headers}
              mapping={parsedFile.mapping}
              onChange={(header, field) =>
                setParsedFile((current) =>
                  current
                    ? {
                        ...current,
                        mapping: { ...current.mapping, [header]: field as ImportableField | 'ignore' },
                      }
                    : current,
                )
              }
            />
            {duplicateTargets.length > 0 ? (
              <p className="text-sm text-destructive">
                Hay campos destino duplicados. Corrige el mapeo antes de continuar.
              </p>
            ) : null}
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Vista previa</h3>
            <ImportPreview rows={previewRows} />
          </div>

          <Button
            onClick={() =>
              importAction.execute({
                rows: previewRows
                  .filter((row) => row.errors.length === 0)
                  .map((row) => ({
                    title: row.title,
                    author: row.author,
                    isbn: row.isbn,
                    sku: row.sku,
                    stockQuantity: row.stockQuantity,
                    minStock: row.minStock,
                    category: row.category,
                    notes: row.notes,
                    publisher: row.publisher,
                    year: row.year,
                    pages: row.pages,
                    costPrice: row.costPrice,
                    salePrice: row.salePrice,
                  })),
              })
            }
            disabled={duplicateTargets.length > 0 || importAction.status === "executing"}
          >
            {importAction.status === "executing"
              ? "Importando..."
              : `Importar ${previewRows.filter((row) => row.errors.length === 0).length} productos`}
          </Button>
        </>
      ) : null}

      {result ? <ImportResult imported={result.imported} skipped={result.skipped} /> : null}
    </div>
  );
}
