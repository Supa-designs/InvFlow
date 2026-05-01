"use client";

import { useMemo, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/features/import/components/FileUpload";
import { ImportResult } from "@/features/import/components/ImportResult";
import { importProductsAction } from "@/features/import/actions/import.actions";
import {
  buildPreviewRows,
  getHeaderOptions,
  getMainFieldAssignments,
  getMatchedHeaders,
  getRemainingHeaders,
  parseSpreadsheet,
  type ParsedImportFile,
} from "@/features/import/services/import.service";
import type { MainImportField } from "@/features/import/config/column-synonyms";

type Step = 1 | 2 | 3;
type MainAssignments = Partial<Record<MainImportField, string>>;
const BATCH_SIZE = 500;

export function ImportPanel() {
  const router = useRouter();
  const [parsedFile, setParsedFile] = useState<ParsedImportFile | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [mainAssignments, setMainAssignments] = useState<MainAssignments>({});
  const [filterHeaders, setFilterHeaders] = useState<string[]>([]);
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [jobProgress, setJobProgress] = useState<{ processed: number; total: number } | null>(null);

  const matchedHeaders = useMemo(() => (parsedFile ? getMatchedHeaders(parsedFile) : []), [parsedFile]);
  const assignmentRows = useMemo(() => (parsedFile ? getMainFieldAssignments(parsedFile) : []), [parsedFile]);
  const headerOptions = useMemo(() => (parsedFile ? getHeaderOptions(parsedFile) : []), [parsedFile]);
  const assignedHeaders = useMemo(
    () => Object.values(mainAssignments).filter((value): value is string => Boolean(value)),
    [mainAssignments],
  );
  const secondaryCandidates = useMemo(
    () => (parsedFile ? getRemainingHeaders(parsedFile, assignedHeaders) : []),
    [assignedHeaders, parsedFile],
  );
  const secondaryHeaders = useMemo(
    () => secondaryCandidates.map(({ header }) => header),
    [secondaryCandidates],
  );

  const previewRows = useMemo(() => {
    if (!parsedFile) return [];
    return buildPreviewRows({
      rows: parsedFile.rows,
      mainAssignments,
      secondaryHeaders,
      filterHeaders,
    });
  }, [filterHeaders, mainAssignments, parsedFile, secondaryHeaders]);

  const importAction = useAction(importProductsAction, {
    onSuccess: ({ data }) => {
      if (!data) return;
      setResult(data);
      toast.success("Importación completada");
      setWizardOpen(false);
      router.push("/products");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "No se pudo completar la importación");
    },
  });

  async function handleFileSelected(file: File) {
    try {
      const next = await parseSpreadsheet(file);
      setParsedFile(next);
      setResult(null);
      setStep(1);
      setMainAssignments(
        Object.fromEntries(
          getMainFieldAssignments(next)
            .filter((item) => item.detectedHeader)
            .map((item) => [item.field, item.detectedHeader]),
        ) as MainAssignments,
      );
      setFilterHeaders([]);
      setWizardOpen(true);
      setFileInputKey((current) => current + 1);
    } catch {
      toast.error("No se pudo leer el archivo");
    }
  }

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  function setAssignment(field: MainImportField, value: string) {
    setMainAssignments((current) => {
      const next = { ...current };
      if (!value) {
        delete next[field];
        return next;
      }

      for (const [assignedField, assignedHeader] of Object.entries(next)) {
        if (assignedHeader === value && assignedField !== field) {
          delete next[assignedField as MainImportField];
        }
      }

      next[field] = value;
      return next;
    });
  }

  async function runImportJob(rows: typeof previewRows) {
    setIsImporting(true);
    setJobProgress({ processed: 0, total: rows.length });
    try {
      let imported = 0;
      let updated = 0;
      let skipped = 0;

      for (let index = 0; index < rows.length; index += BATCH_SIZE) {
        const batch = rows.slice(index, index + BATCH_SIZE);
        const response = await importAction.executeAsync({ rows: batch });
        imported += response?.data?.imported ?? 0;
        updated += response?.data?.updated ?? 0;
        skipped += response?.data?.skipped ?? 0;
        setJobProgress({
          processed: Math.min(rows.length, index + batch.length),
          total: rows.length,
        });
      }

      setResult({ imported, updated, skipped });
      toast.success("Importación completada");
      router.push("/products");
    } finally {
      setIsImporting(false);
      setJobProgress(null);
    }
  }

  function handleImport() {
    const rows = previewRows.filter((row) => row.errors.length === 0);
    setWizardOpen(false);
    void runImportJob(rows);
  }

  return (
    <div className="space-y-6 rounded-2xl border bg-card p-6">
      <div>
        <h2 className="text-lg font-semibold">Importar datos</h2>
        <p className="text-sm text-muted-foreground">
          Carga un archivo bibliográfico y completa el asistente paso a paso.
        </p>
      </div>

      <FileUpload key={fileInputKey} onFileSelected={handleFileSelected} />

      {isImporting && jobProgress ? (
        <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm">
          <p className="font-medium">Importación en proceso</p>
          <p className="text-muted-foreground">
            Procesados {jobProgress.processed} de {jobProgress.total} registros
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${jobProgress.total ? (jobProgress.processed / jobProgress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : null}

      {result ? (
        <ImportResult imported={result.imported} updated={result.updated} skipped={result.skipped} />
      ) : null}

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Importación guiada</DialogTitle>
            <DialogDescription>
              {parsedFile
                ? `${parsedFile.fileName} · ${parsedFile.rowCount} filas detectadas`
                : "Configura la importación de tu archivo."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className={step === 1 ? "text-foreground" : ""}>1. Campos coincidentes</span>
            <span>/</span>
            <span className={step === 2 ? "text-foreground" : ""}>2. Asignar campos base</span>
            <span>/</span>
            <span className={step === 3 ? "text-foreground" : ""}>3. Filtros a crear</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-4">
                  <p className="font-medium">Coincidencia con campos base del sistema</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Estas columnas del archivo coinciden con campos que InvFlow ya maneja por default,
                    como ISBN, SKU, título, autor o notas.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {matchedHeaders.map((item) => (
                      <div key={item.header} className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-muted-foreground">Columna detectada: {item.sourceLabel}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-4">
                  <p className="font-medium">Asignar campos base del inventario</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Puedes ajustar manualmente cualquier campo base detectado para evitar mapeos incorrectos.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {assignmentRows.length > 0 ? assignmentRows.map((item) => {
                      const currentValue = mainAssignments[item.field] || "";
                      return (
                        <div
                          key={item.field}
                          className="space-y-2 rounded-xl border px-4 py-3"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{item.label}</p>
                            {item.detectedLabel ? (
                              <p className="text-xs text-muted-foreground">
                                Sugerido: {item.detectedLabel}
                              </p>
                            ) : null}
                          </div>
                          <Select
                            value={currentValue || "__empty__"}
                            onValueChange={(value) =>
                              setAssignment(item.field, !value || value === "__empty__" ? "" : value)
                            }
                          >
                            <SelectTrigger className="w-full rounded-xl border-border bg-background">
                              <SelectValue placeholder="Asignar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__empty__">Sin asignar</SelectItem>
                              {headerOptions.map((option) => {
                                const alreadyUsed =
                                  option.header !== currentValue && assignedHeaders.includes(option.header);
                                return (
                                  <SelectItem
                                    key={option.header}
                                    value={option.header}
                                    disabled={alreadyUsed}
                                  >
                                    {option.label}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }) : (
                      <div className="rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                        No hay campos base detectados. Puedes continuar al siguiente paso.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-4">
                <div className="rounded-xl border bg-card p-4">
                  <p className="font-medium">Filtros a crear</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Los campos no asignados en el paso 2 pasarán automáticamente a secundarios y se
                    guardarán en Notas. Selecciona aquí cuáles quieres convertir en filtros para Productos.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {secondaryCandidates.map(({ header, label }) => (
                      <label key={header} className="flex items-center gap-3 rounded-xl border px-4 py-3 text-sm">
                        <Checkbox
                          checked={filterHeaders.includes(header)}
                          onCheckedChange={() => setFilterHeaders((current) => toggle(current, header))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {filterHeaders.length > 0 ? (
                  <div className="rounded-xl border border-dashed px-4 py-3 text-sm text-muted-foreground">
                    Se crearán filtros para: <span className="font-medium">{filterHeaders.join(", ")}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((current) => (current - 1) as Step)}>
                Anterior
              </Button>
            ) : null}

            {step < 3 ? (
              <Button onClick={() => setStep((current) => (current + 1) as Step)}>Siguiente</Button>
            ) : (
              <Button onClick={handleImport} disabled={isImporting || importAction.status === "executing"}>
                {isImporting || importAction.status === "executing"
                  ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  )
                  : `Importar ${previewRows.filter((row) => row.errors.length === 0).length} títulos`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
