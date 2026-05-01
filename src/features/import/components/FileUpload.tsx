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
          if (!file) return;
          const validExtension = /\.(csv|xls|xlsx)$/i.test(file.name);
          const validSize = file.size <= 10 * 1024 * 1024;
          if (!validExtension || !validSize) {
            event.currentTarget.value = "";
            return;
          }
          onFileSelected(file);
          event.currentTarget.value = "";
        }}
      />
      <p className="text-sm text-muted-foreground">
        Soporta archivos CSV, XLS y XLSX de hasta 10 MB.
      </p>
    </div>
  );
}
