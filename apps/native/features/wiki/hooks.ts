import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addFavorite,
  fetchStudentArticleDetail,
  fetchStudentArticles,
  fetchStudentCategories,
  removeFavorite,
  type StudentArticlesQuery,
} from "./api";
import type {
  StudentArticleDetail,
  StudentArticleListItem,
} from "@server/modules/wiki/types/article";

export const wikiKeys = {
  all: ["wiki"] as const,
  articles: (params?: StudentArticlesQuery) =>
    [...wikiKeys.all, "articles", params] as const,
  article: (id: number) => [...wikiKeys.all, "article", id] as const,
  categories: () => [...wikiKeys.all, "categories"] as const,
};

type ArticlesQueryData = {
  articles: StudentArticleListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type ToggleFavoriteContext = {
  previousArticleQueries: Array<
    [readonly unknown[], ArticlesQueryData | undefined]
  >;
  previousDetail?: StudentArticleDetail;
};

export function useStudentArticles(params?: StudentArticlesQuery) {
  return useQuery({
    queryKey: wikiKeys.articles(params),
    queryFn: () => fetchStudentArticles(params),
  });
}

export function useStudentArticleDetail(id: number) {
  return useQuery({
    queryKey: wikiKeys.article(id),
    queryFn: () => fetchStudentArticleDetail(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useStudentCategories() {
  return useQuery({
    queryKey: wikiKeys.categories(),
    queryFn: fetchStudentCategories,
    staleTime: 30 * 60 * 1000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["toggleFavorite"],
    mutationFn: async ({
      articleId,
      isFavorite,
    }: {
      articleId: number;
      isFavorite: boolean;
    }): Promise<{ articleId: number; isFavorite: boolean }> => {
      if (isFavorite) {
        await removeFavorite(articleId);
        return { articleId, isFavorite: false };
      }

      await addFavorite(articleId);
      return { articleId, isFavorite: true };
    },
    onMutate: async ({ articleId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: wikiKeys.all });

      const previousArticleQueries =
        queryClient.getQueriesData<ArticlesQueryData>({
          queryKey: wikiKeys.articles(),
        });

      const previousDetail = queryClient.getQueryData<StudentArticleDetail>(
        wikiKeys.article(articleId),
      );

      previousArticleQueries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          articles: data.articles.map((article) =>
            article.id === articleId
              ? { ...article, isBookmarked: !isFavorite }
              : article,
          ),
        });
      });

      if (previousDetail) {
        queryClient.setQueryData(wikiKeys.article(articleId), {
          ...previousDetail,
          isBookmarked: !isFavorite,
        });
      }

      return { previousArticleQueries, previousDetail };
    },
    onError: (_error, _variables, context?: ToggleFavoriteContext) => {
      context?.previousArticleQueries?.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, data);
      });

      if (context?.previousDetail) {
        queryClient.setQueryData(
          wikiKeys.article(context.previousDetail.article.id),
          context.previousDetail,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: wikiKeys.all });
    },
  }) as ReturnType<
    typeof useMutation<
      { articleId: number; isFavorite: boolean },
      Error,
      { articleId: number; isFavorite: boolean },
      ToggleFavoriteContext
    >
  >;
}
