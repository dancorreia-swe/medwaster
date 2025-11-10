import { createFileRoute } from "@tanstack/react-router";
import {
  UserDetailPage,
  userOverviewQueryOptions,
} from "@/features/users";

export const Route = createFileRoute("/_auth/admin/users/$userId/")({
  beforeLoad: () => ({ getTitle: () => "Detalhes do Usuário" }),
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
