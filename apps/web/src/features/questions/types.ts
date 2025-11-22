export const QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "fill_in_the_blank",
  "matching",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Múltipla escolha",
  true_false: "Verdadeiro ou Falso",
  fill_in_the_blank: "Complete a frase",
  matching: "Associação",
};

export const QUESTION_DIFFICULTIES = ["basic", "intermediate", "advanced"] as const;

export type QuestionDifficulty = (typeof QUESTION_DIFFICULTIES)[number];

export const QUESTION_DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  basic: "Básico",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

export const QUESTION_STATUS = ["draft", "active", "inactive", "archived"] as const;

export type QuestionStatus = (typeof QUESTION_STATUS)[number];

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  draft: "Rascunho",
  active: "Ativo",
  inactive: "Inativo",
  archived: "Arquivado",
};

export const QUESTION_SORT_OPTIONS = [
  "modified_desc",
  "created_desc",
  "name_asc",
  "category_asc",
] as const;

export type QuestionSortOption = (typeof QUESTION_SORT_OPTIONS)[number];

export interface QuestionListItem {
  id: number;
  prompt: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  category: {
    id: number;
    name: string;
    slug: string;
    color?: string | null;
  } | null;
  author: {
    id: string;
    name: string;
  } | null;
  tags: {
    questionId: number;
    tagId: number;
    assignedBy: string;
    createdAt: string;
    tag: {
      id: number;
      name: string;
      slug: string;
      description: string | null;
      color: string;
      createdAt: string;
      updatedAt: string;
    };
  }[];
  imageUrl?: string | null;
  imageKey?: string | null;
  references?: Array<{
    title: string;
    url?: string;
    type: "book" | "article" | "website" | "other";
  }> | null;
  usageCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface QuestionListResponse {
  data: QuestionListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface QuestionListQueryParams {
  q?: string;
  categoryId?: number;
  type?: QuestionType | QuestionType[];
  difficulty?: QuestionDifficulty;
  tags?: string[];
  status?: QuestionStatus;
  authorId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sort?: QuestionSortOption;
}
