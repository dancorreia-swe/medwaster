import { client } from "@/lib/client";
import { queryOptions } from "@tanstack/react-query";

// Create articles query options with filtering support
export const articlesQueryOptions = (params?: {
  search?: string;
  status?: string;
  category?: string;
  page?: number;
  limit?: number;
}) => queryOptions({
  queryKey: ["wiki", "articles", params],
  queryFn: () => client.wiki.articles.get({
    query: params
  }),
});

// Single article query options
export const articleQueryOptions = (id: number) => queryOptions({
  queryKey: ["wiki", "articles", id],
  queryFn: () => client.wiki.articles[id].get(),
});

// Articles analytics query options
export const articleAnalyticsQueryOptions = () => queryOptions({
  queryKey: ["wiki", "articles", "analytics"],
  queryFn: () => client.wiki.articles.analytics?.get(),
});

// Categories query options
export const categoriesQueryOptions = () => queryOptions({
  queryKey: ["wiki", "categories"],
  queryFn: () => client.wiki.categories?.get(),
});

// Tags query options  
export const tagsQueryOptions = () => queryOptions({
  queryKey: ["wiki", "tags"],
  queryFn: () => client.wiki.tags?.get(),
});

// Export types for components
export type ArticleListItem = {
  id: number;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  excerpt?: string;
  readingTimeMinutes?: number;
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