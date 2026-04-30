"use client";

import {
  FIELD_DEFINITIONS,
  IMPORTABLE_FIELDS,
  getFieldLabel,
  getFieldSection,
  type ImportableField,
} from "@/features/import/config/column-synonyms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SECTION_LABELS = {
  main: "Campos principales",
  facet: "Facetas",
  additional: "Campos adicionales",
} as const;

export function ColumnMapper({
  headers,
  mapping,
  onChange,
}: {
  headers: string[];
  mapping: Record<string, ImportableField | "ignore">;
  onChange: (header: string, field: ImportableField | "ignore") => void;
}) {
  return (
    <div className="space-y-3">
      {headers.map((header) => (
        <div key={header} className="grid items-center gap-3 md:grid-cols-[1fr_260px]">
          <div className="rounded-xl border bg-card px-4 py-3 text-sm">{header}</div>
          <Select
            value={mapping[header] || "ignore"}
            onValueChange={(value) => onChange(header, value as ImportableField | "ignore")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ignore">Ignorar</SelectItem>
              {(["main", "facet", "additional"] as const).map((section) => {
                const fields = IMPORTABLE_FIELDS.filter((field) => getFieldSection(field) === section);
                return (
                  <div key={section}>
                    <div className="px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {SECTION_LABELS[section]}
                    </div>
                    {fields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {getFieldLabel(field)}
                      </SelectItem>
                    ))}
                  </div>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
