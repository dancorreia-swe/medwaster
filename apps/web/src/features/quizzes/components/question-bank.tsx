import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Check, X, SlidersHorizontal } from "lucide-react";
import { stripHtml, cn } from "@/lib/utils";
import { categoriesListQueryOptions } from "@/features/questions/api/categoriesAndTagsQueries";
import { questionsListQueryOptions } from "@/features/questions/api/questionsQueries";
import {
  QUESTION_TYPES,
  QUESTION_DIFFICULTIES,
  QUESTION_TYPE_LABELS,
  QUESTION_DIFFICULTY_LABELS,
} from "@/features/questions/types";
import type {
  QuestionListItem,
  QuestionType,
  QuestionDifficulty,
} from "@/features/questions/types";
import { quizDifficultyOption } from "../types";

interface QuestionFilters {
  search?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  categoryId?: number;
}

interface QuestionBankProps {
  onAddQuestion: (questionId: number, question: QuestionListItem) => void;
  addedQuestionIds: Set<number>;
  onClose: () => void;
}

function BankRow({
  question,
  isAdded,
  onAdd,
}: {
  question: QuestionListItem;
  isAdded: boolean;
  onAdd: () => void;
}) {
  const difficulty = quizDifficultyOption(question.difficulty);

  return (
    <button
      type="button"
      onClick={isAdded ? undefined : onAdd}
      disabled={isAdded}
      className={cn(
        "group w-full px-4 py-3 text-left transition-colors",
        isAdded
          ? "cursor-not-allowed opacity-55"
          : "hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:outline-none",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {isAdded ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Plus className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm leading-snug">
            {stripHtml(question.prompt)}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">
              {QUESTION_TYPE_LABELS[question.type]}
            </span>
            {difficulty && (
              <Badge variant="secondary" className={difficulty.badgeClass}>
                {difficulty.label}
              </Badge>
            )}
            {question.category && (
              <Badge variant="outline" className="font-normal">
                {question.category.name}
              </Badge>
            )}
          </span>
        </span>
      </div>
    </button>
  );
}

export function QuestionBank({
  onAddQuestion,
  addedQuestionIds,
  onClose,
}: QuestionBankProps) {
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories = [] } = useQuery(categoriesListQueryOptions());

  const {
    data: questionsResponse,
    isLoading,
    error,
  } = useQuery(
    questionsListQueryOptions({
      q: filters.search,
      type: filters.type ? [filters.type] : undefined,
      difficulty: filters.difficulty,
      categoryId: filters.categoryId,
      pageSize: 50,
    }),
  );

  const questions = questionsResponse?.data || [];

  const setFilter = useCallback(
    (key: keyof QuestionFilters, value: unknown) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === "all" ? undefined : value,
      }));
    },
    [],
  );

  const activeFilterCount = [
    filters.type,
    filters.difficulty,
    filters.categoryId,
  ].filter(Boolean).length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-1">
        <h2 className="text-sm font-semibold">Banco de perguntas</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          aria-label="Fechar banco de perguntas"
          className="h-7 w-7 p-0 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar perguntas"
            value={filters.search || ""}
            onChange={(e) => setFilter("search", e.target.value || undefined)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters((open) => !open)}
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ search: filters.search })}
              className="h-7 px-2 text-xs text-muted-foreground"
            >
              Limpar
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="space-y-2">
            <Select
              value={filters.type || "all"}
              onValueChange={(value) => setFilter("type", value)}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {QUESTION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.difficulty || "all"}
              onValueChange={(value) => setFilter("difficulty", value)}
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as dificuldades</SelectItem>
                {QUESTION_DIFFICULTIES.map((difficulty) => (
                  <SelectItem key={difficulty} value={difficulty}>
                    {QUESTION_DIFFICULTY_LABELS[difficulty]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.categoryId?.toString() || "all"}
              onValueChange={(value) =>
                setFilter(
                  "categoryId",
                  value === "all" ? undefined : Number(value),
                )
              }
            >
              <SelectTrigger className="h-8 w-full text-xs">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category: { id: number; name: string }) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="relative min-h-0 flex-1 border-t">
        <ScrollArea className="absolute inset-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-destructive">
                Não foi possível carregar as perguntas
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {error instanceof Error ? error.message : "Tente novamente."}
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              {filters.search || activeFilterCount > 0
                ? "Nenhuma pergunta corresponde a esses filtros."
                : "Nenhuma pergunta cadastrada ainda."}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {questions.map((question: QuestionListItem) => (
                <BankRow
                  key={question.id}
                  question={question}
                  isAdded={addedQuestionIds.has(question.id)}
                  onAdd={() => onAddQuestion(question.id, question)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
