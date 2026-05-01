"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Trash, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { deleteCategoryAction } from "../actions/categories.actions";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

export type CategoryRow = {
  id: string;
  name: string;
  color: string | null;
};

export const columns: ColumnDef<CategoryRow>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex min-w-[220px] items-center gap-2 whitespace-normal font-medium">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: row.getValue("color") || '#cccccc' }} 
        />
        {row.getValue("name")}
      </div>
    ),
  },
  {
    accessorKey: "color",
    header: "Color Hex",
    cell: ({ row }) => <div className="text-muted-foreground uppercase">{row.getValue("color") || "-"}</div>,
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const category = row.original;
      return (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => (table.options.meta as any)?.onDelete(category)}>
            <Trash className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      );
    },
  },
];

interface CategoriesTableProps {
  data: CategoryRow[];
}

export function CategoriesTable({ data }: CategoriesTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(null);

  useEffect(() => {
    const handler = () => setFormOpen(true);
    window.addEventListener("invflow:open-category-dialog", handler as EventListener);
    return () => window.removeEventListener("invflow:open-category-dialog", handler as EventListener);
  }, []);

  const { executeAsync: deleteCategory, isExecuting: isDeleting } = useAction(deleteCategoryAction, {
    onSuccess: () => {
      toast.success('Categoría eliminada');
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      router.refresh();
    },
    onError: (e) => toast.error('Error al eliminar: ' + e?.error?.serverError)
  });

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    meta: {
      onDelete: (c: CategoryRow) => {
        setCategoryToDelete(c);
        setDeleteConfirmOpen(true);
      }
    }
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva categoría
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-zinc-950">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay categorías configuradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryFormDialog 
        open={formOpen} 
        onOpenChange={setFormOpen} 
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Eliminar categoría"
        description={`¿Estás seguro que deseas eliminar "${categoryToDelete?.name}"? Esta acción no se puede deshacer y deslindará la categoría de sus productos.`}
        confirmLabel={isDeleting ? "Eliminando..." : "Eliminar"}
        onConfirm={async () => {
          if (categoryToDelete) {
            await deleteCategory({ id: categoryToDelete.id });
          }
        }}
        destructive
      />
    </div>
  );
}
