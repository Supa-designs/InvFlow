"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { addQuickMovementAction } from "@/features/inventory/actions/inventory.actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { PackagePlus } from "lucide-react";

interface StockAdjustmentDialogProps {
  productId: string;
  productName: string;
  currentStock: number;
  compact?: boolean;
}

export function StockAdjustmentDialog({
  productId,
  productName,
  currentStock,
  compact = false,
}: StockAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"entry" | "exit">("entry");
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState("");

  const { execute, isExecuting } = useAction(addQuickMovementAction, {
    onSuccess: () => {
      toast.success("Stock ajustado exitosamente");
      setOpen(false);
      setQuantity(1);
      setNotes("");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Error al ajustar el stock");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    execute({
      productId,
      type,
      quantity,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button
            variant={compact ? "ghost" : "outline"}
            size={compact ? "icon" : "sm"}
            className={compact ? "h-8 w-8" : "gap-2"}
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        <PackagePlus className="h-4 w-4" />
        {compact ? null : "Ajustar Stock"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar Stock: {productName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stock Actual</Label>
              <div className="p-2 bg-muted rounded-md text-sm text-center font-medium">
                {currentStock}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nuevo Stock Estimado</Label>
              <div className="p-2 bg-blue-50 text-blue-700 rounded-md text-sm text-center font-medium">
                {type === "entry" ? currentStock + quantity : Math.max(0, currentStock - quantity)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Ajuste</Label>
            <Select value={type} onValueChange={(v) => { if (v) setType(v as "entry" | "exit"); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Entrada (Sumar)</SelectItem>
                <SelectItem value="exit">Salida (Restar/Mermas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cantidad</Label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Notas / Motivo</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Ajuste de inventario, merma..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isExecuting}>
              {isExecuting ? "Guardando..." : "Confirmar Ajuste"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
