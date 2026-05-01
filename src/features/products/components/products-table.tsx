"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { FileEdit, Plus, Trash } from "lucide-react";
import { useQueryState } from "nuqs";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontalIcon } from "@/components/ui/sliders-horizontal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockAdjustmentDialog } from "@/features/inventory/components/StockAdjustmentDialog";
import { deleteProductAction } from "@/features/products/actions/products.actions";
import { ProductDetailDialog } from "./product-detail-dialog";
import { ProductFormDialog } from "./ProductFormDialog";

type CategoryOption = { id: string; name: string; color?: string | null };

export type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  categoryId?: string | null;
  stockQuantity: number | null;
  minStock: number | null;
  salePrice: number | string | null;
  costPrice?: number | string | null;
  metadata: any;
  description?: string | null;
};

interface ProductsTableProps {
  data: ProductRow[];
  availableFacets?: Array<{ label: string; values: string[] }>;
  isLibrary?: boolean;
  categories?: CategoryOption[];
  showCategories?: boolean;
  showPricing?: boolean;
  showMinStock?: boolean;
  page: number;
  totalPages: number;
  totalRows: number;
  pageSize: number;
}

export function ProductsTable({
  data,
  availableFacets = [],
  isLibrary,
  categories = [],
  showCategories = true,
  showPricing = true,
  showMinStock = true,
  page,
  totalPages,
  totalRows,
  pageSize,
}: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery] = useQueryState("q", { defaultValue: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [initialBarcode, setInitialBarcode] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  const deleteAction = useAction(deleteProductAction, {
    onSuccess: () => {
      setDeleteTarget(null);
    },
  });

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const facetDefinitions = useMemo(() => availableFacets, [availableFacets]);

  const filteredData = useMemo(() => {
    const query = (searchQuery || "").trim().toLowerCase();
    return data.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.sku || "").toLowerCase().includes(query) ||
        (product.barcode || "").toLowerCase().includes(query) ||
        (product.metadata?.author || "").toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query);

      const facets = ((product.metadata?.filters ?? product.metadata?.facets) ?? {}) as Record<string, string>;
      const matchesFacets = Object.entries(selectedFilters).every(([label, value]) => {
        if (!value || value === "__all__") return true;
        return facets[label] === value;
      });

      return matchesSearch && matchesFacets;
    });
  }, [data, searchQuery, selectedFilters]);

  useEffect(() => {
    const handler = () => {
      setEditingProduct(null);
      setFormOpen(true);
    };
    window.addEventListener("invflow:open-product-dialog", handler as EventListener);
    return () => window.removeEventListener("invflow:open-product-dialog", handler as EventListener);
  }, []);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;
    const barcode = searchParams.get("barcode") ?? "";
    setEditingProduct(null);
    setInitialBarcode(barcode);
    setFormOpen(true);
    router.replace("/products");
  }, [router, searchParams]);

  useEffect(() => {
    if (!selectedProductId) return;
    let cancelled = false;
    setDetailLoading(true);
    fetch(`/api/products/${selectedProductId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((payload) => {
        if (cancelled || !payload?.product) return;
        setSelectedProduct(payload.product);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProductId]);

  function openDetail(product: ProductRow) {
    setSelectedProduct(product);
    setSelectedProductId(product.id);
    setDetailOpen(true);
  }

  const columns = useMemo<ColumnDef<ProductRow>[]>(() => {
    const dynamicColumns: ColumnDef<ProductRow>[] = [
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <button
            type="button"
            className="min-w-[120px] text-left font-medium hover:text-primary"
            onClick={() => {
              openDetail(row.original);
            }}
          >
            {row.getValue("sku") || "-"}
          </button>
        ),
      },
      {
        accessorKey: "name",
        header: "Título",
        cell: ({ row }) => (
          <button
            type="button"
            className="min-w-[240px] whitespace-normal text-left font-medium leading-5 hover:text-primary"
            onClick={() => {
              openDetail(row.original);
            }}
          >
            {row.getValue("name")}
          </button>
        ),
      },
      {
        id: "author",
        header: "Autor",
        cell: ({ row }) => (
          <button
            type="button"
            className="min-w-[180px] whitespace-normal text-left text-muted-foreground hover:text-primary"
            onClick={() => {
              openDetail(row.original);
            }}
          >
            {row.original.metadata?.author || "-"}
          </button>
        ),
      },
    ];

    if (showCategories) {
      dynamicColumns.push({
        id: "category",
        header: "Categoría",
        cell: ({ row }) => {
          const category = row.original.categoryId ? categoryMap.get(row.original.categoryId) : null;
          return (
            <button
              type="button"
              className="min-w-[160px] whitespace-normal text-left text-muted-foreground hover:text-primary"
              onClick={() => {
                openDetail(row.original);
              }}
            >
              {category ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-background shadow-sm"
                    style={{ backgroundColor: category.color || "#94a3b8" }}
                  />
                  {category.name}
                </span>
              ) : (
                "Sin categoría"
              )}
            </button>
          );
        },
      });
    }

    dynamicColumns.push(
      {
        accessorKey: "stockQuantity",
        header: isLibrary ? "Ejemplares" : "Existencias",
        cell: ({ row }) => <div className="min-w-[110px]">{Number(row.getValue("stockQuantity")) || 0}</div>,
      },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const stock = Number(row.original.stockQuantity) || 0;
          return (
            <StockAdjustmentDialog
              compact
              productId={row.original.id}
              productName={row.original.name}
              currentStock={stock}
            />
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row, table }) => {
          const product = row.original;
          return (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  (table.options.meta as any)?.onEdit(product);
                }}
              >
                <FileEdit className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.stopPropagation();
                  setDeleteTarget(product);
                }}
              >
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          );
        },
      },
    );

    return dynamicColumns;
  }, [categoryMap, isLibrary, showCategories, showMinStock]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    meta: {
      onEdit: (product: ProductRow) => {
        setEditingProduct(product);
        setFormOpen(true);
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          className="h-10 rounded-2xl border-zinc-700/50 bg-zinc-950 px-4 text-zinc-100 hover:bg-zinc-900 hover:text-white"
          onClick={() => setFiltersOpen(true)}
        >
          <SlidersHorizontalIcon size={16} />
          Filtros
        </Button>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" />
          {isLibrary ? "Agregar título" : "Nuevo producto"}
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          Página {page} de {totalPages} · Mostrando {table.getRowModel().rows.length} de {totalRows} fila(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (page <= 1) return;
              const next = new URLSearchParams(searchParams.toString());
              next.set("page", String(page - 1));
              router.push(`/products?${next.toString()}`);
            }}
            disabled={page <= 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (page >= totalPages) return;
              const next = new URLSearchParams(searchParams.toString());
              next.set("page", String(page + 1));
              router.push(`/products?${next.toString()}`);
            }}
            disabled={page >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle>Filtros</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/20 p-3">
              <input
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"
                placeholder="Buscar filtros..."
                onChange={() => {}}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
            {facetDefinitions.length === 0 ? (
              <div className="col-span-2 rounded-xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                Aún no hay filtros creados para este tenant. Importa y selecciona campos en el paso 3.
              </div>
            ) : facetDefinitions.map((facet) => (
              <div key={facet.label} className="space-y-2">
                <p className="text-sm font-medium">{facet.label}</p>
                <Select
                  value={selectedFilters[facet.label] || "__all__"}
                  onValueChange={(value) =>
                    setSelectedFilters((current) => ({
                      ...current,
                      [facet.label]: value ?? "__all__",
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{selectedFilters[facet.label] || `Todos ${facet.label}`}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos</SelectItem>
                    {facet.values.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setSelectedFilters(
                  Object.fromEntries(facetDefinitions.map((facet) => [facet.label, "__all__"])),
                )
              }
            >
              Limpiar filtros
            </Button>
            <Button onClick={() => setFiltersOpen(false)}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esta acción desactivará <strong>{deleteTarget?.name}</strong> y lo ocultará de Productos.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteTarget) return;
                deleteAction.execute({ id: deleteTarget.id });
              }}
              disabled={deleteAction.status === "executing"}
            >
              {deleteAction.status === "executing" ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(value) => {
          if (!value) {
            setEditingProduct(null);
            setInitialBarcode("");
          }
          setFormOpen(value);
        }}
        editProduct={editingProduct}
        businessType={isLibrary ? "library" : "generic"}
        categories={categories}
        showCategories={showCategories}
        showPricing={showPricing}
        initialBarcode={initialBarcode}
      />

      <ProductDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        product={selectedProduct}
        loading={detailLoading}
        onEdit={() => {
          setDetailOpen(false);
          setEditingProduct(selectedProduct);
          setFormOpen(true);
        }}
      />
    </div>
  );
}
