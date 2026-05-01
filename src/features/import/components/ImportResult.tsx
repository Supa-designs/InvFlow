"use client";

export function ImportResult({
  imported,
  updated,
  skipped,
}: {
  imported: number;
  updated: number;
  skipped: number;
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-sm">
      Importados: <span className="font-semibold">{imported}</span> · Omitidos:{" "}
      <span className="font-semibold">{skipped}</span> · Actualizados:{" "}
      <span className="font-semibold">{updated}</span>
    </div>
  );
}
