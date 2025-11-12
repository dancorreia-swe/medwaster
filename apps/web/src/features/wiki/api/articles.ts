import { client } from "@/lib/client";
import { queryOptions } from "@tanstack/react-query";

// Create articles query options with filtering support
export const articlesQueryOptions = (params?: {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}) =>
  queryOptions({
    queryKey: ["wiki", "articles", params],
    queryFn: () =>
      client.wiki.articles.get({
        query: params,
      }),
  });

// Single article query options
export const articleQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["wiki", "articles", id],
    queryFn: () => client.wiki.articles({ id }).get(),
  });

// Categories query options
export const categoriesQueryOptions = () =>
  queryOptions({
    queryKey: ["wiki", "categories"],
    queryFn: async () => {
      // Mock data for now since we don't have categories endpoint yet
      return {
        data: [
          { id: 1, name: "Biological Waste" },
          { id: 2, name: "Chemical Waste" },
          { id: 3, name: "Pharmaceutical Waste" },
          { id: 4, name: "Pathological Waste" },
          { id: 5, name: "Sharps" },
        ],
      };
    },
  });

// Tags query options
export const tagsQueryOptions = () =>
  queryOptions({
    queryKey: ["wiki", "tags"],
    queryFn: async () => {
      // Mock data for now since we don't have tags endpoint yet
      return {
        data: [
          { id: 1, name: "biológico" },
          { id: 2, name: "descarte" },
          { id: 3, name: "segurança" },
          { id: 4, name: "anvisa" },
          { id: 5, name: "rdc222" },
          { id: 6, name: "procedimento" },
        ],
      };
    },
  });

// Export types for components
export type ArticleListItem = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  excerpt?: string;
  readingTimeMinutes?: number;
  icon?: string;
  category?: {
    id: number;
    name: string;
  };
  author: {
    id: string;
    name?: string;
    email: string;
  };
  tags: Array<{
    id: number;
    name: string;
  }>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  viewCount: number;
};

export type ArticleDetail = ArticleListItem & {
  content: any; // BlockNote JSON
  contentText?: string;
  metaDescription?: string;
  featuredImageUrl?: string;
};
