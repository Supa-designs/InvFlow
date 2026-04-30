"use client";

import { Badge } from "@/components/ui/badge";
import type { ImportPreviewRow } from "@/features/import/validators/import.validator";

export function ImportPreview({ rows }: { rows: ImportPreviewRow[] }) {
  return (
    <div className="space-y-3">
      {rows.slice(0, 8).map((row) => (
        <div
          key={row.key}
          className={`rounded-xl border px-4 py-3 ${row.errors.length > 0 ? "border-destructive/50 bg-destructive/5" : "bg-card"}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{row.title || "Sin título"}</p>
              <p className="text-sm text-muted-foreground">
                Filas agrupadas: {row.rowNumbers.join(", ")}
              </p>
            </div>
            <span className="text-sm text-muted-foreground">{row.stockQuantity} ejemplares</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {row.author ? <Badge variant="outline">Autor: {row.author}</Badge> : null}
            {Object.entries(row.facets).map(([label, value]) => (
              <Badge key={`${label}:${value}`} variant="outline">
                {label}: {value}
              </Badge>
            ))}
          </div>

          {row.notes ? (
            <pre className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
              {row.notes}
            </pre>
          ) : null}

          {row.errors.length > 0 ? (
            <p className="mt-2 text-sm text-destructive">{row.errors.join(", ")}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
