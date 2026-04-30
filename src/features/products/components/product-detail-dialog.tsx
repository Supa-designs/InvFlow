"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProductDetailDialog({
  open,
  onOpenChange,
  product,
  loading = false,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any | null;
  loading?: boolean;
  onEdit?: () => void;
}) {
  if (!product && !loading) return null;
  if (loading || !product) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Cargando detalles...</DialogTitle>
          </DialogHeader>
          <div className="h-32 animate-pulse rounded-xl border bg-muted/20" />
        </DialogContent>
      </Dialog>
    );
  }

  const metadata = (product.metadata ?? {}) as Record<string, any>;
  const facets = Object.entries(metadata.facets ?? {}).filter(([, value]) => value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Datos principales</p>
              <div className="rounded-xl border bg-card p-4 text-sm">
                <dl className="space-y-2">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">ISBN</dt>
                    <dd className="text-right font-medium">{product.barcode || "-"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Autor</dt>
                    <dd className="text-right font-medium">{metadata.author || "-"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">SKU</dt>
                    <dd className="text-right font-medium">{product.sku || "-"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Ejemplares</dt>
                    <dd className="text-right font-medium">{product.stockQuantity || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Filtros</p>
              <div className="rounded-xl border bg-card p-4">
                {facets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Este registro aún no tiene filtros importados.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {facets.map(([label, value]) => (
                      <Badge key={`${label}:${String(value)}`} variant="outline" className="h-auto px-3 py-1 text-sm">
                        <span className="text-muted-foreground">{label}:</span> {String(value)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Notas</p>
            <div className="min-h-[180px] rounded-xl border bg-card p-4">
              {product.description ? (
                <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">{product.description}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">Este registro no tiene notas visibles.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
            {onEdit ? <Button onClick={onEdit}>Editar libro</Button> : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
