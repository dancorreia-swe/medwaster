// Trail types
export type TrailDifficulty = "basic" | "intermediate" | "advanced";
export type TrailStatus = "draft" | "published" | "inactive" | "archived";
export type ContentType = "question" | "quiz" | "article";

export type Trail = {
  id: number;
  uuid: string;
  trailId: string;
  name: string;
  description: string | null;
  categoryId: number | null;
  difficulty: TrailDifficulty;
  status: TrailStatus;
  unlockOrder: number;
  passPercentage: number;
  attemptsAllowed: number;
  timeLimitMinutes: number | null;
  allowSkipQuestions: boolean;
  showImmediateExplanations: boolean;
  randomizeContentOrder: boolean;
  coverImageUrl: string | null;
  themeColor: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  estimatedTimeMinutes: number | null;
  customCertificate: boolean;
  authorId: string;
  enrolledCount: number;
  completionRate: number;
  averageCompletionMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  author?: {
    id: string;
    name: string;
    image: string | null;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
    color: string | null;
  };
  content?: TrailContent[];
  prerequisites?: TrailPrerequisite[];
};

export type TrailContent = {
  id: number;
  trailId: number;
  questionId: number | null;
  quizId: number | null;
  articleId: number | null;
  sequence: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  question?: {
    id: number;
    prompt: string;
    type: string;
    difficulty: string;
  };
  quiz?: {
    id: number;
    title: string;
    difficulty: string;
    timeLimit: number | null;
  };
  article?: {
    id: number;
    title: string;
    excerpt: string | null;
    readingTimeMinutes: number | null;
  };
};

export type TrailPrerequisite = {
  trailId: number;
  prerequisiteTrailId: number;
  createdAt: string;
  // Relations
  prerequisiteTrail?: {
    id: number;
    name: string;
    difficulty: TrailDifficulty;
    status: TrailStatus;
  };
};

// Request/Response types
export type TrailListQueryParams = {
  page?: number;
  pageSize?: number;
  status?: TrailStatus;
  difficulty?: TrailDifficulty;
  categoryId?: number;
  search?: string;
};

export type TrailListResponse = {
  data: Trail[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type CreateTrailBody = {
  name: string;
  description?: string;
  categoryId?: number | null;
  difficulty: TrailDifficulty;
  status?: TrailStatus;
  unlockOrder?: number | null;
  passPercentage?: number;
  attemptsAllowed?: number;
  timeLimitMinutes?: number | null;
  allowSkipQuestions?: boolean;
  showImmediateExplanations?: boolean;
  randomizeContentOrder?: boolean;
  coverImageUrl?: string | null;
  themeColor?: string | null;
  availableFrom?: string | null;
  availableUntil?: string | null;
  estimatedTimeMinutes?: number | null;
  customCertificate?: boolean;
};

export type UpdateTrailBody = Partial<CreateTrailBody>;

export type AddContentBody = {
  contentType: ContentType;
  contentId: number;
  sequence: number;
  isRequired?: boolean;
};

export type UpdateContentBody = {
  sequence?: number;
  isRequired?: boolean;
};

export type ReorderContentBody = {
  contentUpdates: Array<{
    contentId: number;
    sequence: number;
  }>;
};

export type AddPrerequisiteBody = {
  prerequisiteTrailId: number;
};

// Content search types
export type ContentSearchResult = {
  id: number;
  type: ContentType;
  title: string;
  description?: string;
  difficulty?: string;
};
