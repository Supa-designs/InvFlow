"use client";

import type { ImportPreviewRow } from "@/features/import/validators/import.validator";

export function ImportPreview({ rows }: { rows: ImportPreviewRow[] }) {
  return (
    <div className="space-y-3">
      {rows.slice(0, 5).map((row) => (
        <div
          key={row.rowNumber}
          className={`rounded-xl border px-4 py-3 ${row.errors.length > 0 ? "border-destructive/50 bg-destructive/5" : "bg-card"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">
              Fila {row.rowNumber}: {row.title || "Sin título"}
            </p>
            <span className="text-sm text-muted-foreground">{row.stockQuantity} ejemplares</span>
          </div>
          {row.author ? <p className="text-sm text-muted-foreground">{row.author}</p> : null}
          {row.errors.length > 0 ? (
            <p className="mt-2 text-sm text-destructive">{row.errors.join(", ")}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
