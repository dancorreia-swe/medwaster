import { useMemo } from "react";

import Loader from "@/components/loader";
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
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  QUESTION_DIFFICULTY_LABELS,
  QUESTION_STATUS_LABELS,
  QUESTION_TYPE_LABELS,
} from "../types";
import type { QuestionListItem } from "../types";

export interface QuestionsTableProps {
  data: QuestionListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  isLoading: boolean;
  error?: Error | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSize: number;
}

const statusClassName: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-500",
  active: "bg-emerald-500/20 text-emerald-500",
  inactive: "bg-muted text-muted-foreground",
  archived: "bg-gray-500/20 text-gray-400",
};

export function QuestionsTable({
  data,
  meta,
  isLoading,
  error,
  onPageChange,
  onPageSizeChange,
  pageSize,
}: QuestionsTableProps) {
  const totalPages = Math.max(meta.totalPages || 1, 1);
  const hasPrevious = meta.page > 1;
  const hasNext = meta.page < totalPages;

  const columns = useMemo<ColumnDef<QuestionListItem>[]>(
    () => [
      {
        header: "Questão",
        accessorKey: "prompt",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{truncate(row.original.prompt)}</p>
            <span className="text-xs text-muted-foreground">
              #{String(row.original.id).padStart(6, "0")}
            </span>
          </div>
        ),
      },
      {
        header: "Tipo",
        accessorKey: "type",
        cell: ({ row }) => (
          <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            {QUESTION_TYPE_LABELS[row.original.type]}
          </span>
        ),
      },
      {
        header: "Categoria",
        accessorKey: "category",
        cell: ({ row }) =>
          row.original.category ? (
            <span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">
              {row.original.category.name}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Sem categoria</span>
          ),
      },
      {
        header: "Nível",
        accessorKey: "difficulty",
        cell: ({ row }) => <DifficultyBadge difficulty={row.original.difficulty} />,
      },
      {
        header: "Tags",
        accessorKey: "tags",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tags.slice(0, 5).map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-accent px-2 py-1 text-xs text-accent-foreground"
              >
                {tag.name}
              </span>
            ))}
            {row.original.tags.length > 5 ? (
              <span className="text-xs text-muted-foreground">
                +{row.original.tags.length - 5} mais
              </span>
            ) : null}
          </div>
        ),
      },
      {
        header: "Trilhas",
        accessorKey: "usageCount",
        cell: ({ row }) => (
          <span className="text-center text-sm font-semibold">{row.original.usageCount}</span>
        ),
      },
      {
        header: "Autor",
        accessorKey: "author",
        cell: ({ row }) =>
          row.original.author ? (
            <span className="text-sm text-foreground">{row.original.author.name}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Desconhecido</span>
          ),
      },
      {
        header: "Criada em",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        header: "Atualizada em",
        accessorKey: "updatedAt",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
        ),
      },
      {
        header: "Status",
        accessorKey: "status",
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
              statusClassName[row.original.status] ?? "bg-muted text-muted-foreground",
            )}
          >
            {QUESTION_STATUS_LABELS[row.original.status]}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Ações",
        cell: ({ row }) => <ActionsMenu status={row.original.status} />,
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const renderedTable = useMemo(() => {
    if (isLoading && !data.length) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-6 text-sm text-destructive">
          {error.message || "Não foi possível carregar as questões."}
        </div>
      );
    }

    return (
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
              <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma questão encontrada com os filtros selecionados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  }, [columns.length, data.length, error, isLoading, table]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Banco de questões</h2>
          <p className="text-sm text-muted-foreground">
            {meta.total} resultado{meta.total === 1 ? "" : "s"} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Página {meta.page} de {totalPages}</span>
        </div>
      </div>

      {renderedTable}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Itens por página:</span>
          <select
            className="h-9 rounded-md border border-border bg-transparent px-2"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!hasPrevious}
            onClick={() => onPageChange(meta.page - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            disabled={!hasNext}
            onClick={() => onPageChange(meta.page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}

function truncate(value: string, limit = 80) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit)}…`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function DifficultyBadge({ difficulty }: { difficulty: QuestionListItem["difficulty"] }) {
  const levels = {
    basic: 1,
    intermediate: 2,
    advanced: 3,
  } as const;

  const active = levels[difficulty];

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      {Array.from({ length: 3 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          className={cn(
            "transition-colors",
            index < active ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/50",
          )}
        />
      ))}
      <span>{QUESTION_DIFFICULTY_LABELS[difficulty]}</span>
    </div>
  );
}

function ActionsMenu({ status }: { status: QuestionListItem["status"] }) {
  const toggleLabel = status === "active" ? "Desativar" : "Ativar";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          Ações
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled>Visualizar</DropdownMenuItem>
        <DropdownMenuItem disabled>Editar</DropdownMenuItem>
        <DropdownMenuItem disabled>{toggleLabel}</DropdownMenuItem>
        <DropdownMenuItem disabled>Duplicar</DropdownMenuItem>
        <DropdownMenuItem disabled>Excluir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
