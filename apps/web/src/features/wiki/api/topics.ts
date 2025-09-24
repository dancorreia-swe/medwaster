import { client } from "@/lib/client";
import { queryOptions } from "@tanstack/react-query";

export const topicsQueryOptions = queryOptions({
  queryKey: ["topics"],
  queryFn: () => client.wiki.private.get(),
});
