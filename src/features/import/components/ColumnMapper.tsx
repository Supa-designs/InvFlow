"use client";

import { IMPORTABLE_FIELDS, type ImportableField } from "@/features/import/config/column-synonyms";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ColumnMapper({
  headers,
  mapping,
  onChange,
}: {
  headers: string[];
  mapping: Record<string, ImportableField | 'ignore'>;
  onChange: (header: string, field: ImportableField | 'ignore') => void;
}) {
  return (
    <div className="space-y-3">
      {headers.map((header) => (
        <div key={header} className="grid items-center gap-3 md:grid-cols-[1fr_220px]">
          <div className="rounded-xl border bg-card px-4 py-3 text-sm">{header}</div>
          <Select value={mapping[header]} onValueChange={(value) => onChange(header, value as ImportableField | 'ignore')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ignore">Ignorar</SelectItem>
              {IMPORTABLE_FIELDS.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
