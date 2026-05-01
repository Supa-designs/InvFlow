"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createProductAction, updateProductAction } from "@/features/products/actions/products.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type CategoryOption = {
  id: string;
  name: string;
  color?: string | null;
};

function normalizeIsbn(value: string) {
  return value.replace(/[-\s]/g, "").trim();
}

const EMPTY_FORM = {
  isbn: "",
  title: "",
  author: "",
  sku: "",
  categoryId: "",
  copiesCount: 1,
  notes: "",
  salePrice: "",
  costPrice: "",
};

export interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: any | null;
  businessType?: string;
  categories?: CategoryOption[];
  showCategories?: boolean;
  showPricing?: boolean;
  initialBarcode?: string;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  editProduct,
  businessType = "generic",
  categories = [],
  showCategories = true,
  showPricing = true,
  initialBarcode = "",
}: ProductFormDialogProps) {
  const router = useRouter();
  const skuInputRef = useRef<HTMLInputElement | null>(null);
  const isLibrary = businessType === "library";
  const isEdit = !!editProduct;
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    const metadata = editProduct?.metadata ?? {};
    const copies = metadata?.copies;

    if (!editProduct) {
      setForm({ ...EMPTY_FORM, isbn: initialBarcode });
      if (isLibrary && initialBarcode) {
        void lookupIsbn(initialBarcode);
      }
      return;
    }

    setForm({
      isbn: metadata?.isbn || editProduct?.barcode || "",
      title: editProduct?.name || "",
      author: metadata?.author || "",
      sku: editProduct?.sku || "",
      categoryId: editProduct?.categoryId || "",
      copiesCount: Math.max(1, Number(copies?.available ?? editProduct?.stockQuantity ?? 1)),
      notes: metadata?.notes || editProduct?.description || "",
      salePrice: editProduct?.salePrice ? String(editProduct.salePrice) : "",
      costPrice: editProduct?.costPrice ? String(editProduct.costPrice) : "",
    });
  }, [editProduct, initialBarcode, isLibrary, open]);

  useEffect(() => {
    if (!open || !isLibrary || isEdit) return;
    const normalizedIsbn = normalizeIsbn(form.isbn);
    if (normalizedIsbn.length < 10) return;

    const timeout = window.setTimeout(() => {
      void lookupIsbn(normalizedIsbn);
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [form.isbn, isEdit, isLibrary, open]);

  async function lookupIsbn(rawIsbn: string) {
    const isbn = normalizeIsbn(rawIsbn);
    if (!isbn || isbn.length < 10) return;
    setIsLookupLoading(true);

    try {
      const response = await fetch(`/api/lookup/isbn?q=${encodeURIComponent(isbn)}`);
      if (!response.ok) {
        throw new Error("lookup failed");
      }

      const data = await response.json();
      setForm((current) => ({
        ...current,
        isbn,
        title: data.title || current.title || "",
        author: data.authors || current.author || "",
        notes: current.notes || [data.publishers, data.publish_date].filter(Boolean).join(" · "),
      }));
      toast.success(`ISBN encontrado en ${data.source}`);
      window.requestAnimationFrame(() => {
        skuInputRef.current?.focus();
      });
    } catch {
      toast.error("No se pudo consultar el ISBN");
    } finally {
      setIsLookupLoading(false);
    }
  }

  const createProduct = useAction(createProductAction, {
    onSuccess: () => {
      toast.success("Producto creado exitosamente");
      onOpenChange(false);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "No se pudo crear el producto");
    },
  });

  const updateProduct = useAction(updateProductAction, {
    onSuccess: () => {
      toast.success("Producto actualizado exitosamente");
      onOpenChange(false);
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "No se pudo actualizar el producto");
    },
  });

  const isSaving = createProduct.status === "executing" || updateProduct.status === "executing";

  const payload = useMemo(() => {
    const normalizedIsbn = normalizeIsbn(form.isbn);
    const copiesCount = Math.max(1, Number(form.copiesCount) || 1);

    return {
      name: form.title,
      description: form.notes || null,
      sku: form.sku || null,
      barcode: normalizedIsbn || null,
      categoryId: form.categoryId || null,
      stockQuantity: copiesCount,
      minStock: 0,
      costPrice: showPricing ? form.costPrice || null : null,
      salePrice: showPricing ? form.salePrice || null : null,
      trackingMode: "sku" as const,
      metadata: {
        isbn: normalizedIsbn || null,
        author: form.author || null,
        thumbnail: normalizedIsbn
          ? `https://covers.openlibrary.org/b/isbn/${normalizedIsbn}-M.jpg`
          : null,
        notes: form.notes || null,
        copies: {
          available: copiesCount,
          loaned: 0,
          lost: 0,
          damaged: 0,
        },
      },
    };
  }, [form, showPricing]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!payload.name.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    if (isEdit) {
      updateProduct.execute({ id: editProduct.id, ...payload });
      return;
    }

    createProduct.execute(payload);
  }

  const categoryTriggerLabel = form.categoryId
    ? categories.find((category) => category.id === form.categoryId) || null
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEdit ? "Editar producto" : "Crear producto"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isLibrary
              ? "Completa los datos principales del título y sus copias."
              : "Registra el producto con los campos base del inventario."}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isLibrary ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="isbn" className="text-xs uppercase tracking-wide text-muted-foreground">
                  ISBN
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="isbn"
                    value={form.isbn}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, isbn: event.target.value }))
                    }
                    onBlur={() => lookupIsbn(form.isbn)}
                    placeholder="978..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => lookupIsbn(form.isbn)}
                    disabled={isLookupLoading}
                  >
                    {isLookupLoading ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Título
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Autor
                </Label>
                <Input
                  id="author"
                  value={form.author}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, author: event.target.value }))
                  }
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="title">Nombre</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </div>
          )}

          <div className={`grid gap-4 ${showCategories ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-xs uppercase tracking-wide text-muted-foreground">
                SKU
              </Label>
              <Input
                ref={skuInputRef}
                id="sku"
                value={form.sku}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sku: event.target.value }))
                }
              />
            </div>

            {showCategories ? (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Categoría
                </Label>
                <Select
                  value={form.categoryId || "__empty__"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: value === "__empty__" ? "" : String(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__empty__">Sin asignar</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-background shadow-sm"
                            style={{ backgroundColor: category.color || "#94a3b8" }}
                          />
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="copiesCount" className="text-xs uppercase tracking-wide text-muted-foreground">
                Ejemplares
              </Label>
              <Input
                id="copiesCount"
                type="number"
                min="1"
                value={form.copiesCount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    copiesCount: Math.max(1, Number(event.target.value) || 1),
                  }))
                }
              />
            </div>
          </div>

          {showPricing ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Costo
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={form.costPrice}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, costPrice: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Precio
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, salePrice: event.target.value }))
                  }
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs uppercase tracking-wide text-muted-foreground">
              Notas
            </Label>
            <Textarea
              id="notes"
              rows={5}
              className="min-h-[110px] resize-y"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder={isLibrary ? "Notas internas del libro" : "Notas internas"}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
