"use client";

import { Input } from "@/components/ui/input";

export function FileUpload({
  onFileSelected,
}: {
  onFileSelected: (file: File) => void;
}) {
  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      <p className="text-sm text-muted-foreground">
        Soporta archivos CSV, XLS y XLSX.
      </p>
    </div>
  );
}
