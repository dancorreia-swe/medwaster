import { createFileRoute } from "@tanstack/react-router";
import {
  UsersPage,
  listUsersQueryOptions,
  userStatsQueryOptions,
} from "@/features/users";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Usuários";

export const Route = createFileRoute("/_auth/admin/users/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
  loader: async ({ context }) => {
    const queryClient = context.queryClient;
    await Promise.all([
      queryClient.ensureQueryData(
        listUsersQueryOptions({ page: 1, pageSize: 20 }),
      ),
      queryClient.ensureQueryData(userStatsQueryOptions()),
    ]);
    return null;
  },
  component: UsersPage,
});
