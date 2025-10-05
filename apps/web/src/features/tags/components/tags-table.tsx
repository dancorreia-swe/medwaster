import { useMemo, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatDate } from "@/lib/utils";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  ChevronUpIcon,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

export interface TagTableItem {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  createdAt?: string | null;
}

interface TagsTableProps {
  data: TagTableItem[];
  onEdit?: (tag: TagTableItem) => void;
  onDelete?: (tag: TagTableItem) => void;
}

const DEFAULT_COLOR = "#94a3b8";

export function TagsTable({ data, onEdit, onDelete }: TagsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "name",
      desc: false,
    },
  ]);

  const columns = useMemo<ColumnDef<TagTableItem>[]>(
    () => [
      {
        id: "color",
        header: "",
        size: 48,
        cell: ({ row }) => {
          const color = row.original.color || DEFAULT_COLOR;

          return (
            <div className="flex items-center justify-center w-full">
              <span
                aria-hidden
                className="inline-flex h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: color }}
              />
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: "Nome",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {row.original.name}
            </span>
            {row.original.description ? (
              <span className="text-xs text-muted-foreground">
                {row.original.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "slug",
        header: "Identificador",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.slug}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Criada em",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        enableSorting: false,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => onEdit?.(row.original)}
                className={cn(!onEdit && "pointer-events-none opacity-50")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(row.original)}
                className={cn(!onDelete && "pointer-events-none opacity-50")}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [onDelete, onEdit],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();

                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className={cn(
                          "flex items-center gap-1 text-sm font-medium",
                          header.column.getIsSorted()
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <SortIcon direction={header.column.getIsSorted()} />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                Nenhuma tag encontrada.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SortIcon({ direction }: { direction: false | "asc" | "desc" }) {
  const directions  = {
    asc: <ChevronUp className="size-4" />,
    desc: <ChevronDown className="size-4" />,
  } as const;

  return direction ? directions[direction] : <ChevronsUpDown className="size-4 text-muted-foreground"/>;
 }
