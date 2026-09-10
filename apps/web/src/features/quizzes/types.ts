export interface QuizListQueryParams {
  page?: number;
  pageSize?: number;
  status?: string | string[];
  difficulty?: string | string[];
  categoryId?: number | number[];
  search?: string;
}

export interface QuizListItem {
  id: number;
  title: string;
  description?: string | null;
  difficulty: "basic" | "intermediate" | "advanced" | "mixed";
  status: "draft" | "active" | "inactive" | "archived";
  categoryId?: number | null;
  authorId: string;
  timeLimit?: number | null;
  maxAttempts?: number;
  passingScore?: number | null;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
  author: {
    id: string;
    name: string;
    image?: string | null;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export interface QuizFilters {
  search?: string;
  status?: string[];
  difficulty?: string[];
  categoryId?: number[];
}
export type QuizDifficulty = "basic" | "intermediate" | "advanced" | "mixed";
export type QuizStatus = "draft" | "active" | "inactive" | "archived";

/**
 * Badge classes are token-based so they hold up in dark mode. Tailwind colour
 * literals (`bg-green-100 text-green-800`) render as light-on-light there.
 */
export const QUIZ_DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: QuizDifficulty;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "basic",
    label: "Básico",
    badgeClass: "bg-success/10 text-success border-success/20",
  },
  {
    value: "intermediate",
    label: "Intermediário",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  {
    value: "advanced",
    label: "Avançado",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
  },
  {
    value: "mixed",
    label: "Misto",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
];

export const QUIZ_STATUS_OPTIONS: ReadonlyArray<{
  value: QuizStatus;
  label: string;
  badgeClass: string;
}> = [
  {
    value: "draft",
    label: "Rascunho",
    badgeClass: "bg-muted text-muted-foreground border-border",
  },
  {
    value: "active",
    label: "Ativo",
    badgeClass: "bg-success/10 text-success border-success/20",
  },
  {
    value: "inactive",
    label: "Inativo",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  },
  {
    value: "archived",
    label: "Arquivado",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
  },
];

export function quizDifficultyOption(difficulty: string) {
  return QUIZ_DIFFICULTY_OPTIONS.find((o) => o.value === difficulty);
}

export function quizStatusOption(status: string) {
  return QUIZ_STATUS_OPTIONS.find((o) => o.value === status);
}

export interface QuizFormData {
  title: string;
  description: string;
  instructions: string;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  categoryId?: number | null;
  timeLimit?: number | null;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  passingScore: number;
  imageUrl?: string | null;
  imageKey?: string | null;
  tagIds?: number[];
}
