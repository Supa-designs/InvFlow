"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useScanner } from "@/hooks/use-scanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanBarcode, Plus } from "lucide-react";
import { toast } from "sonner";
import { lookupProductByBarcodeAction, addQuickMovementAction } from "@/features/inventory/actions/inventory.actions";
import { useAction } from "next-safe-action/hooks";

export function InventoryModeModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [lastScanned, setLastScanned] = useState<{ id: string, code: string, name: string } | null>(null);
  const [pendingCode, setPendingCode] = useState("");

  const { execute: quickMovement, status: movementStatus } = useAction(addQuickMovementAction, {
    onSuccess: ({ data }) => {
      if (data) {
        toast.success(`Entrada registrada. Nuevo stock: ${data.newStock}`);
      }
    },
    onError: ({ error }) => {
      toast.error("Error al registrar movimiento: " + error.serverError);
    }
  });

  const { execute: lookupProduct, status: lookupStatus } = useAction(lookupProductByBarcodeAction, {
    onSuccess: ({ data }) => {
      if (data) {
        setLastScanned({ id: data.id, code: data.barcode || '', name: data.name });
        toast.success(`Producto encontrado: ${data.name}`);
        quickMovement({
          productId: data.id,
          type: "entry",
          quantity: 1,
          notes: "Registro rápido via modo inventario",
        });
      } else {
        toast.error("Producto no encontrado. Abriendo alta rápida.");
        setIsOpen(false);
        router.push(`/products?create=1&barcode=${encodeURIComponent(pendingCode)}`);
      }
    },
    onError: ({ error }) => {
      toast.error("Error al buscar producto: " + error.serverError);
    }
  });

  useEffect(() => {
    const listener = () => setIsOpen(true);
    window.addEventListener("invflow:open-inventory-mode", listener as EventListener);
    return () => window.removeEventListener("invflow:open-inventory-mode", listener as EventListener);
  }, []);

  const handleScan = (code: string) => {
    if (!isOpen) return; // Solo funciona si el modal está abierto
    setPendingCode(code);
    lookupProduct({ barcode: code });
  };

  useScanner({ onScan: handleScan });

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <ScanBarcode className="mr-2 h-4 w-4" />
        Modo Inventario
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modo Inventario Rápido</DialogTitle>
            <DialogDescription>
              Escanea un código de barras para buscar el producto de inmediato.<br/>
              Asegúrate de que este diálogo esté abierto al escanear.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            {lookupStatus === "executing" ? (
              <div className="text-sm text-muted-foreground animate-pulse">Buscando producto...</div>
            ) : lastScanned ? (
              <div className="w-full text-center space-y-4">
                <div className="p-4 border rounded-md bg-muted/50">
                  <p className="font-semibold">{lastScanned.name}</p>
                  <p className="text-sm text-muted-foreground">EAN/UPC: {lastScanned.code}</p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    disabled={movementStatus === "executing"}
                  >
                    <Plus className="w-5 h-5" />
                    {movementStatus === "executing" ? "Sumando..." : "Listo, se agregó 1 ejemplar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center opacity-50">
                <ScanBarcode className="w-16 h-16 mb-4" />
                <p>Esperando lectura de escaner...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
