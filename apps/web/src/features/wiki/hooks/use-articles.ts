import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { articlesInfiniteQueryOptions } from "../api/wikiQueries";
import type { ArticleListQueryParams } from "../api/wikiApi";

type UseArticlesOptions = Omit<ArticleListQueryParams, "page"> & {
  itemsPerPage?: number;
  initialOffset?: number;
};

export function useArticles(options?: UseArticlesOptions) {
  const itemsPerPage = options?.itemsPerPage ?? options?.limit ?? 12;
  const initialOffset = options?.initialOffset ?? options?.offset ?? 0;

  const query = useInfiniteQuery(
    articlesInfiniteQueryOptions({
      ...options,
      limit: itemsPerPage,
      offset: initialOffset,
    }),
  );

  const articles = useMemo(
    () =>
      query.data?.pages.flatMap(
        (page) => page?.data?.data?.articles ?? [],
      ) ?? [],
    [query.data],
  );

  const currentPage = useMemo(() => {
    const pagination = query.data?.pages.at(-1)?.data?.data?.pagination;
    return (
      pagination?.page ??
      Math.floor(initialOffset / itemsPerPage) + 1
    );
  }, [query.data, initialOffset, itemsPerPage]);

  const loadMoreArticles = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage]);

  return {
    ...query,
    articles,
    currentPage,
    itemsPerPage,
    loadMoreArticles,
  };
}
