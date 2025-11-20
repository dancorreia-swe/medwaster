import { createFileRoute } from "@tanstack/react-router";
import {
  UserDetailPage,
  userOverviewQueryOptions,
} from "@/features/users";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Detalhes do Usuário";

export const Route = createFileRoute("/_auth/admin/users/$userId/")({
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
  loader: async ({ context, params }) => {
    const { queryClient } = context;
    const { userId } = params;

    await queryClient.ensureQueryData(userOverviewQueryOptions(userId));
    return null;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { userId } = Route.useParams();
  return <UserDetailPage userId={userId} />;
}
