import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { client } from "@/lib/client";
import type { ListTagsQuery } from "@server/modules/tags/model";
import type { TagsService } from "@server/modules/tags/service";

type TagsList = Awaited<ReturnType<typeof TagsService.getAll>>;
type TagRow = TagsList extends (infer Item)[] ? Item : never;

export type ListTagsQueryInput = ListTagsQuery | undefined;
export type TagDto = TagRow;

const tagsClient = (client as typeof client & {
  tags: {
    get: (params?: { query?: ListTagsQuery }) => Promise<{ success: boolean; data: TagRow[] }>;
  };
}).admin.tags;

async function fetchTags(query?: ListTagsQueryInput) {
  const response = query ? await tagsClient.get({ query }) : await tagsClient.get();

  if (!response.data?.success) {
    throw new Error("Não foi possível carregar as tags.");
  }

  return response.data.data;
}

export const tagsQueryKeys = {
  all: ["tags"] as const,
  list: (query?: ListTagsQueryInput) =>
    [...tagsQueryKeys.all, "list", query] as const,
};

export function listTagsQueryOptions(query?: ListTagsQueryInput) {
  return queryOptions({
    queryKey: tagsQueryKeys.list(query),
    queryFn: () => fetchTags(query),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}
