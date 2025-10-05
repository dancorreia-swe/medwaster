import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { client } from "@/lib/client";
import type { SuccessResponse } from "@server/lib/responses";
import type { ListTagsQuery } from "@server/modules/tags/model";
import type { TagsService } from "@server/modules/tags/service";

type TagsList = Awaited<ReturnType<typeof TagsService.getAll>>;
type TagRow = TagsList extends (infer Item)[] ? Item : never;

export type ListTagsQueryInput = ListTagsQuery | undefined;
export type ListTagsResponse = SuccessResponse<TagRow[]>;
export type TagDto = TagRow;

const tagsClient = (client as typeof client & {
  tags: {
    get: (params?: { query?: ListTagsQuery }) => Promise<ListTagsResponse>;
  };
}).tags;

function fetchTags(query?: ListTagsQueryInput) {
  return query ? tagsClient.get({ query }) : tagsClient.get();
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
