"use client";

export function ImportResult({
  imported,
  skipped,
}: {
  imported: number;
  skipped: number;
}) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-sm">
      Importados: <span className="font-semibold">{imported}</span> · Omitidos:{" "}
      <span className="font-semibold">{skipped}</span>
    </div>
  );
}
