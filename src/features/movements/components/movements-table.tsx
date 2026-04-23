"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export type MovementRow = {
  id: string;
  productName: string | null;
  type: string;
  reason: string | null;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  notes: string | null;
  clerkUserId: string;
  createdAt: Date | null;
};

const translateType = (type: string) => {
  switch (type) {
    case 'in': return 'Entrada';
    case 'out': return 'Salida';
    case 'adjustment': return 'Ajuste';
    default: return type;
  }
};

const translateReason = (reason: string | null) => {
  switch (reason) {
    case 'purchase': return 'Compra';
    case 'sale': return 'Venta';
    case 'return': return 'Devolución';
    case 'loss': return 'Pérdida';
    case 'loan': return 'Préstamo';
    case 'adjustment': return 'Ajuste inventario';
    default: return reason || '-';
  }
};

export const columns: ColumnDef<MovementRow>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4"
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const val = row.getValue("createdAt") as Date;
      return val ? format(val, 'dd/MM/yyyy HH:mm') : '-';
    },
  },
  {
    accessorKey: "productName",
    header: "Producto",
    cell: ({ row }) => <div className="font-medium">{row.getValue("productName") || 'Producto Eliminado'}</div>,
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const isPositive = type === 'in' || type === 'adjustment';
      return (
        <div className={`font-medium ${type === 'in' ? 'text-green-600' : type === 'out' ? 'text-red-600' : 'text-blue-600'}`}>
          {translateType(type)}
        </div>
      )
    },
  },
  {
    accessorKey: "reason",
    header: "Motivo",
    cell: ({ row }) => <div>{translateReason(row.getValue("reason"))}</div>,
  },
  {
    accessorKey: "quantity",
    header: "Cantidad",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const qt = row.getValue("quantity") as number;
      const sign = type === 'out' ? '-' : '+';
      return (
        <div className="font-bold">
          {sign}{qt}
        </div>
      );
    },
  },
  {
    accessorKey: "quantityAfter",
    header: "Balance Final",
    cell: ({ row }) => <div className="text-muted-foreground">{row.getValue("quantityAfter")}</div>,
  },
  {
    accessorKey: "notes",
    header: "Notas",
  },
];

interface MovementsTableProps {
  data: MovementRow[];
}

export function MovementsTable({ data }: MovementsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);

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
  });

  return (
    <div className="w-full space-y-4">
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
                  No hay movimientos registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
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
  );
}
