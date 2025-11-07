import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import type { QuestionListItem } from "../types";
import { QuestionsGrid } from "./questions-grid";

export interface QuestionsTableProps {
  data: QuestionListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSize: number;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];

  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    rangeWithDots.push(1, "...");
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push("...", totalPages);
  } else if (totalPages > 1) {
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
}

export function QuestionsTable({
  data,
  meta,
  onPageChange,
  onPageSizeChange,
  pageSize,
}: QuestionsTableProps) {
  const totalPages = Math.max(meta.totalPages || 1, 1);
  const hasPrevious = meta.page > 1;
  const hasNext = meta.page < totalPages;
  const pageNumbers = getPageNumbers(meta.page, totalPages);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Banco de questões</h2>
          <p className="text-sm text-muted-foreground">
            {meta.total} resultado{meta.total === 1 ? "" : "s"} encontrado{meta.total === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Exibindo {data.length} de {meta.total}</span>
        </div>
      </div>

      <div className="min-h-[600px]">
        {data.length > 0 ? (
          <QuestionsGrid questions={data} />
        ) : (
          <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
            Nenhuma questão encontrada com os filtros selecionados.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Itens por página:</span>
          <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[12, 24, 48].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex items-center justify-center sm:justify-end" aria-label="Navegação de páginas">
          {/* Mobile: Simplified pagination */}
          <div className="flex items-center gap-1 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              disabled={!hasPrevious}
              onClick={() => onPageChange(meta.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 py-2 text-sm">
              {meta.page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => onPageChange(meta.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop: Full pagination */}
          <div className="hidden sm:flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              disabled={!hasPrevious}
              onClick={() => onPageChange(1)}
              aria-label="Primeira página"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!hasPrevious}
              onClick={() => onPageChange(meta.page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              {pageNumbers.map((pageNum, idx) =>
                pageNum === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={pageNum}
                    variant={meta.page === pageNum ? "default" : "outline"}
                    size="icon"
                    onClick={() => onPageChange(pageNum as number)}
                    aria-label={`Página ${pageNum}`}
                    aria-current={meta.page === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              disabled={!hasNext}
              onClick={() => onPageChange(meta.page + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!hasNext}
              onClick={() => onPageChange(totalPages)}
              aria-label="Última página"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}
