"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "invflow:scanner-configured";

export function ScannerSettingsModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(1);
  const [scanResult, setScanResult] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && step === 2) {
      window.setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, step]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setScanResult("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar scanner</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Conecta tu scanner por USB o Bluetooth. InvFlow lo detecta como entrada de teclado.
            </p>
            <div className="rounded-xl border bg-muted p-4 text-sm text-muted-foreground">
              Recomendación: habilita el sufijo Enter en el scanner para confirmar lecturas.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setStep(2)}>Probar scanner</Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Escanea cualquier código</Label>
              <Input
                ref={inputRef}
                value={scanResult}
                onChange={(event) => setScanResult(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && scanResult.trim().length >= 4) {
                    localStorage.setItem(STORAGE_KEY, "true");
                    setStep(3);
                  }
                }}
                autoFocus
                onBlur={() => window.setTimeout(() => inputRef.current?.focus(), 100)}
                placeholder="Esperando lectura..."
                className="h-12 text-center"
              />
            </div>
            <div className="flex justify-between gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  localStorage.setItem(STORAGE_KEY, "true");
                  setStep(3);
                }}
              >
                Omitir prueba
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card px-4 py-6 text-center">
              <p className="text-lg font-semibold">Scanner configurado</p>
              {scanResult ? (
                <p className="mt-1 text-sm text-muted-foreground">Última lectura: {scanResult}</p>
              ) : null}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>Listo</Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
