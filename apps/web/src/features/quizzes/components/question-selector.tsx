import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDrag } from "react-dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  ChevronDown,
  Filter,
  FileQuestion,
  CheckCircle,
  Circle,
  XCircle,
  Target,
  GripVertical,
} from "lucide-react";
import { stripHtml } from "@/lib/utils";
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

export const DRAG_TYPES = {
  QUESTION_FROM_BANK: "question-from-bank",
} as const;

interface QuestionFilters {
  search?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  categoryId?: number;
}

interface QuestionSelectorProps {
  onAddQuestion: (questionId: number, questionData: QuestionListItem) => void;
  addedQuestionIds?: Set<number>;
}

const questionTypeOptions = QUESTION_TYPES.map((type) => ({
  value: type,
  label: QUESTION_TYPE_LABELS[type],
  icon:
    type === "multiple_choice"
      ? CheckCircle
      : type === "true_false"
        ? Circle
        : type === "fill_in_the_blank"
          ? Target
          : type === "matching"
            ? XCircle
            : FileQuestion,
}));

const difficultyOptions = QUESTION_DIFFICULTIES.map((difficulty) => ({
  value: difficulty,
  label: QUESTION_DIFFICULTY_LABELS[difficulty],
  color:
    difficulty === "basic"
      ? "bg-green-100 text-green-800"
      : difficulty === "intermediate"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800",
}));

interface DraggableQuestionCardProps {
  question: QuestionListItem;
  isAdded: boolean;
  onAddQuestion: (question: QuestionListItem) => void;
}

function DraggableQuestionCard({
  question,
  isAdded,
  onAddQuestion,
}: DraggableQuestionCardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: DRAG_TYPES.QUESTION_FROM_BANK,
    item: { question },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !isAdded,
  });

  const getQuestionTypeIcon = (type: string) => {
    const option = questionTypeOptions.find((opt) => opt.value === type);
    const Icon = option?.icon || FileQuestion;
    return <Icon className="h-4 w-4" />;
  };

  const getDifficultyColor = (difficulty: string) => {
    const option = difficultyOptions.find((opt) => opt.value === difficulty);
    return option?.color || "bg-gray-100 text-gray-800";
  };

  return (
    <Card
      ref={drag}
      className={`p-3 transition-all group relative ${
        isDragging
          ? "opacity-50 rotate-2 scale-105"
          : isAdded
            ? "bg-muted/50 border-muted cursor-not-allowed opacity-60 grayscale"
            : "hover:shadow-md hover:scale-[1.02] cursor-grab active:cursor-grabbing"
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <GripVertical
              className={`h-4 w-4 ${isAdded ? "text-muted-foreground" : "text-muted-foreground/60"}`}
            />
            {getQuestionTypeIcon(question.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight">
              {stripHtml(question.prompt)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <Badge
              variant="secondary"
              className={getDifficultyColor(question.difficulty)}
            >
              {
                difficultyOptions.find((d) => d.value === question.difficulty)
                  ?.label
              }
            </Badge>
            {question.category && (
              <Badge variant="outline" className="text-xs">
                {question.category.name}
              </Badge>
            )}
          </div>

          {isAdded && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Adicionada
            </Badge>
          )}
        </div>

        {question.tags && question.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {question.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs h-4 px-1"
                style={{ color: tag.color || undefined }}
              >
                {tag.name}
              </Badge>
            ))}
            {question.tags.length > 3 && (
              <Badge variant="outline" className="text-xs h-4 px-1">
                +{question.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Hover tooltip for draggable questions */}
        {!isAdded && (
          <div className="absolute bottom-2 left-3 right-3 text-xs text-blue-600 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/95 backdrop-blur-sm rounded px-2 py-1 shadow-sm border">
            <GripVertical className="h-3 w-3" />
            Arraste para o quiz
          </div>
        )}

        {/* Static text for already added questions */}
        {isAdded && (
          <div className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
            <GripVertical className="h-3 w-3 opacity-50" />
            Já foi adicionada ao quiz
          </div>
        )}
      </div>
    </Card>
  );
}

export function QuestionSelector({
  onAddQuestion,
  addedQuestionIds,
}: QuestionSelectorProps) {
  const [filters, setFilters] = useState<QuestionFilters>({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [localAddedQuestions, setLocalAddedQuestions] = useState<Set<number>>(
    new Set(),
  );

  const addedQuestions = addedQuestionIds || localAddedQuestions;

  const { data: categories = [] } = useQuery(categoriesListQueryOptions());

  const {
    data: questionsResponse,
    isLoading: isLoadingQuestions,
    error: questionsError,
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

  const handleFilterChange = useCallback(
    (key: keyof QuestionFilters, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value === "all" ? undefined : value,
      }));
    },
    [],
  );

  const handleAddQuestion = useCallback(
    (question: QuestionListItem) => {
      onAddQuestion(question.id, question);
      if (!addedQuestionIds) {
        setLocalAddedQuestions((prev) => new Set([...prev, question.id]));
      }
    },
    [onAddQuestion, addedQuestionIds],
  );

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Boolean(
    filters.search || filters.type || filters.difficulty || filters.categoryId,
  );

  return (
    <Card className="h-full flex flex-col gap-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileQuestion className="h-4 w-4" />
          Banco de Perguntas
          <Badge variant="secondary" className="ml-auto">
            {questions.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4 p-4 pt-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar perguntas..."
            value={filters.search || ""}
            onChange={(e) =>
              handleFilterChange("search", e.target.value || undefined)
            }
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {
                      [
                        filters.type,
                        filters.difficulty,
                        filters.categoryId,
                      ].filter(Boolean).length
                    }
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-3 mt-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Tipo
              </label>

              <Select
                value={filters.type || "all"}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger className="mt-1 h-8 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {questionTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Dificuldade
              </label>
              <Select
                value={filters.difficulty || "all"}
                onValueChange={(value) =>
                  handleFilterChange("difficulty", value)
                }
              >
                <SelectTrigger className="mt-1 h-8 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as dificuldades</SelectItem>
                  {difficultyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <Badge variant="secondary" className={option.color}>
                        {option.label}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Categoria
              </label>
              <Select
                value={filters.categoryId?.toString() || "all"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "categoryId",
                    value === "all" ? undefined : Number(value),
                  )
                }
              >
                <SelectTrigger className="mt-1 h-8 focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Questions List */}
        <ScrollArea className="flex-1">
          <div className="space-y-3">
            {isLoadingQuestions ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-muted rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : questionsError ? (
              <div className="text-center py-8 text-destructive">
                <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium mb-1">
                  Erro ao carregar perguntas
                </p>
                <p className="text-xs text-muted-foreground">
                  {questionsError instanceof Error
                    ? questionsError.message
                    : "Erro desconhecido"}
                </p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {Object.keys(filters).length > 0
                    ? "Nenhuma pergunta encontrada com os filtros aplicados"
                    : "Nenhuma pergunta disponível"}
                </p>
              </div>
            ) : (
              questions.map((question) => {
                const isAdded = addedQuestions.has(question.id);
                return (
                  <DraggableQuestionCard
                    key={question.id}
                    question={question}
                    isAdded={isAdded}
                    onAddQuestion={handleAddQuestion}
                  />
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
