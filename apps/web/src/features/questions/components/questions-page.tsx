import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { questionsListQueryOptions } from "../api";
import { QuestionsTable } from "./questions-table";
import {
  QuestionFiltersBar,
  type QuestionFilters,
} from "./question-filters-bar";
import type { QuestionListQueryParams } from "../types";

export function QuestionsPage() {
  const [filters, setFilters] = useState<
    QuestionListQueryParams & QuestionFilters
  >({
    page: 1,
    pageSize: 20,
    sort: "modified_desc",
  });

  const { data, isLoading, isFetching, error } = useQuery(
    questionsListQueryOptions(filters),
  );

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setFilters((prev) => ({ ...prev, pageSize, page: 1 }));
  };

  const handleFiltersChange = (newFilters: QuestionFilters) => {
    setFilters((prev) => {
      // Start with base pagination props only
      const updated: QuestionListQueryParams & QuestionFilters = {
        page: 1,
        pageSize: prev.pageSize,
        sort: prev.sort,
      };
      
      // Add current filters that aren't being changed
      Object.entries(prev).forEach(([key, value]) => {
        if (!['page', 'pageSize', 'sort'].includes(key) && !(key in newFilters) && value !== undefined) {
          (updated as any)[key] = value;
        }
      });
      
      // Add new filters that have defined values
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          (updated as any)[key] = value;
        }
        // If value is undefined/null/empty, we intentionally don't add it (which removes it)
      });
      
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Questões</h1>
          <p className="text-muted-foreground">
            Gerencie o banco de questões do sistema
          </p>
        </div>
        <Button asChild>
          <Link to="/questions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova questão
          </Link>
        </Button>
      </div>

      <QuestionFiltersBar
        filters={{
          search: filters.search,
          type: filters.type,
          difficulty: filters.difficulty,
          status: filters.status,
          categoryId: filters.categoryId,
        }}
        onFiltersChange={handleFiltersChange}
      />

      <div className="relative">
        {isFetching && !isLoading && (
          <div className="absolute right-4 top-4 z-10">
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Atualizando...
            </div>
          </div>
        )}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Erro ao carregar questões. Tente novamente.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <QuestionsSkeleton />
        ) : data ? (
          <QuestionsTable
            data={data.data}
            meta={data.meta}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSize={filters.pageSize ?? 20}
          />
        ) : null}
      </div>
    </div>
  );
}

function QuestionsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16 ml-1" />
              </div>
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}
