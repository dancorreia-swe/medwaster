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
  description?: string;
  difficulty: "basic" | "intermediate" | "advanced" | "mixed";
  status: "draft" | "active" | "inactive" | "archived";
  categoryId?: number;
  authorId: string;
  timeLimit?: number;
  maxAttempts?: number;
  passingScore?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface QuizFilters {
  search?: string;
  status?: string[];
  difficulty?: string[];
  categoryId?: number[];
}