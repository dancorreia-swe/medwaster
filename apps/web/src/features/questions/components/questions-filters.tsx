import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  QUESTION_DIFFICULTIES,
  QUESTION_DIFFICULTY_LABELS,
  QUESTION_SORT_OPTIONS,
  QUESTION_STATUS,
  QUESTION_STATUS_LABELS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
} from "../types";
import type {
  QuestionDifficulty,
  QuestionSortOption,
  QuestionStatus,
  QuestionType,
} from "../types";

export type FilterState = {
  q: string;
  types: QuestionType[];
  difficulty: QuestionDifficulty | "";
  status: QuestionStatus | "";
  tags: string;
  dateFrom: string;
  dateTo: string;
  sort: QuestionSortOption;
};

export interface QuestionsFiltersProps {
  value: FilterState;
  onSubmit: (value: FilterState) => void;
  onReset: () => void;
}

const selectClassName =
  "h-10 w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground";

export function QuestionsFilters({ value, onSubmit, onReset }: QuestionsFiltersProps) {
  const [state, setState] = useState<FilterState>(value);

  useEffect(() => {
    setState(value);
  }, [value]);

  const typeSelection = useMemo(() => new Set(state.types), [state.types]);

  function toggleType(type: QuestionType) {
    setState((prev) => {
      const set = new Set(prev.types);
      if (set.has(type)) {
        set.delete(type);
      } else {
        set.add(type);
      }
      return {
        ...prev,
        types: Array.from(set),
      };
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(state);
  }

  function handleReset() {
    onReset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="question-search">Buscar</Label>
          <Input
            id="question-search"
            placeholder="Busque por título, explicação ou tag"
            value={state.q}
            onChange={(event) =>
              setState((prev) => ({ ...prev, q: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo de questão</Label>
          <div className="grid gap-2">
            {QUESTION_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={typeSelection.has(type)}
                  onCheckedChange={() => toggleType(type)}
                  id={`type-${type}`}
                />
                <span>{QUESTION_TYPE_LABELS[type]}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="difficulty">Nível</Label>
          <select
            id="difficulty"
            className={selectClassName}
            value={state.difficulty}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                difficulty: (event.target.value || "") as FilterState["difficulty"],
              }))
            }
          >
            <option value="">Todos</option>
            {QUESTION_DIFFICULTIES.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {QUESTION_DIFFICULTY_LABELS[difficulty]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            className={selectClassName}
            value={state.status}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                status: (event.target.value || "") as FilterState["status"],
              }))
            }
          >
            <option value="">Todos</option>
            {QUESTION_STATUS.map((status) => (
              <option key={status} value={status}>
                {QUESTION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="Separadas por vírgula"
            value={state.tags}
            onChange={(event) =>
              setState((prev) => ({ ...prev, tags: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-from">Data inicial</Label>
          <Input
            id="date-from"
            type="date"
            value={state.dateFrom}
            onChange={(event) =>
              setState((prev) => ({ ...prev, dateFrom: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date-to">Data final</Label>
          <Input
            id="date-to"
            type="date"
            value={state.dateTo}
            onChange={(event) =>
              setState((prev) => ({ ...prev, dateTo: event.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sort">Ordenação</Label>
          <select
            id="sort"
            className={selectClassName}
            value={state.sort}
            onChange={(event) =>
              setState((prev) => ({
                ...prev,
                sort: event.target.value as QuestionSortOption,
              }))
            }
          >
            {QUESTION_SORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="ghost" onClick={handleReset}>
          Limpar filtros
        </Button>
        <Button type="submit">Aplicar filtros</Button>
      </div>
    </form>
  );
}

const SORT_LABELS: Record<QuestionSortOption, string> = {
  modified_desc: "Atualização mais recente",
  created_desc: "Criação mais recente",
  name_asc: "Nome (A-Z)",
  category_asc: "Categoria (A-Z)",
};
