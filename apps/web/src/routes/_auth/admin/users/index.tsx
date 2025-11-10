import { createFileRoute } from "@tanstack/react-router";
import {
  UsersPage,
  listUsersQueryOptions,
  userStatsQueryOptions,
} from "@/features/users";

export const Route = createFileRoute("/_auth/admin/users/")({
  beforeLoad: () => ({ getTitle: () => "Usuários" }),
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
