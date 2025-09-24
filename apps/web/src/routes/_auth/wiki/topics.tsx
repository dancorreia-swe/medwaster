import { topicsQueryOptions } from "@/features/wiki/api/topics";
import { Topics } from "@/features/wiki/components/topics";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/wiki/topics")({
  component: Topics,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(topicsQueryOptions),
});
