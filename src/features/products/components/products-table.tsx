"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, FileEdit, Plus, Trash } from "lucide-react";
import { useQueryState } from "nuqs";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockAdjustmentDialog } from "@/features/inventory/components/StockAdjustmentDialog";
import { ProductFormDialog } from "./ProductFormDialog";

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
};

interface ProductsTableProps {
  data: ProductRow[];
  isLibrary?: boolean;
  categories?: { id: string; name: string }[];
  showCategories?: boolean;
  showPricing?: boolean;
  showMinStock?: boolean;
}

function getProductStatus(product: ProductRow, showMinStock: boolean) {
  const stock = Number(product.stockQuantity) || 0;
  const minStock = Number(product.minStock) || 0;

  if (stock <= 0) {
    return { label: "Agotado", variant: "destructive" as const };
  }

  if (showMinStock && minStock > 0 && stock <= minStock) {
    return { label: "Bajo", variant: "secondary" as const };
  }

  return { label: "Disponible", variant: "secondary" as const };
}

export function ProductsTable({
  data,
  isLibrary,
  categories = [],
  showCategories = true,
  showPricing = true,
  showMinStock = true,
}: ProductsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "" });
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [initialBarcode, setInitialBarcode] = useState("");

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  useEffect(() => {
    const handler = () => {
      setEditingProduct(null);
      setFormOpen(true);
    };
    window.addEventListener("invflow:open-product-dialog", handler as EventListener);
    return () =>
      window.removeEventListener("invflow:open-product-dialog", handler as EventListener);
  }, []);

  useEffect(() => {
    if (searchParams.get("create") !== "1") return;
    const barcode = searchParams.get("barcode") ?? "";
    setEditingProduct(null);
    setInitialBarcode(barcode);
    setFormOpen(true);
    router.replace("/products");
  }, [router, searchParams]);

  const columns = useMemo<ColumnDef<ProductRow>[]>(() => {
    const dynamicColumns: ColumnDef<ProductRow>[] = [
      {
        accessorKey: "sku",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            SKU
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[120px] font-medium text-foreground">
            {row.getValue("sku") || "-"}
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Título
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="min-w-[240px] whitespace-normal font-medium leading-5">
            {row.getValue("name")}
          </div>
        ),
      },
      {
        id: "author",
        header: "Autor",
        cell: ({ row }) => (
          <div className="min-w-[180px] whitespace-normal text-muted-foreground">
            {row.original.metadata?.author || "-"}
          </div>
        ),
      },
    ];

    if (showCategories) {
      dynamicColumns.push({
        id: "category",
        header: "Categoría",
        cell: ({ row }) => (
          <div className="min-w-[150px] whitespace-normal text-muted-foreground">
            {row.original.categoryId ? categoryMap.get(row.original.categoryId) || "-" : "Sin categoría"}
          </div>
        ),
      });
    }

    dynamicColumns.push(
      {
        accessorKey: "stockQuantity",
        header: isLibrary ? "Ejemplares" : "Existencias",
        cell: ({ row }) => (
          <div className="min-w-[110px] text-muted-foreground">
            {Number(row.getValue("stockQuantity")) || 0}
          </div>
        ),
      },
      {
        id: "status",
        header: "Estado",
        cell: ({ row }) => {
          const status = getProductStatus(row.original, showMinStock);
          return <Badge variant={status.variant}>{status.label}</Badge>;
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Acciones</div>,
        cell: ({ row, table }) => {
          const product = row.original;
          return (
            <div className="flex justify-end gap-2">
              <StockAdjustmentDialog
                productId={product.id}
                productName={product.name}
                currentStock={product.stockQuantity || 0}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  (table.options.meta as any)?.onEdit(product);
                }}
              >
                <FileEdit className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon">
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
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter: searchQuery,
    },
    onGlobalFilterChange: setSearchQuery,
    meta: {
      onEdit: (product: ProductRow) => {
        setEditingProduct(product);
        setFormOpen(true);
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder={isLibrary ? "Buscar libros..." : "Buscar productos..."}
          value={searchQuery ?? ""}
          onChange={(event) => setSearchQuery(event.target.value || null)}
          className="max-w-sm"
        />
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
          Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length}{" "}
          fila(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>

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
    </div>
  );
}
