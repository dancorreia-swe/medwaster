import { createFileRoute, Link } from "@tanstack/react-router";
import {
  UserDetailPage,
  userOverviewQueryOptions,
} from "@/features/users";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  errorComponent: ErrorComponent,
});

function RouteComponent() {
  const { userId } = Route.useParams();
  return <UserDetailPage userId={userId} />;
}

function ErrorComponent() {
  return (
    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>
          Não foi possível carregar este usuário. Ele pode ter sido removido ou
          o link está incorreto.
        </AlertDescription>
      </Alert>
      <Button asChild variant="outline">
        <Link to="/admin/users">Voltar para a lista</Link>
      </Button>
    </div>
  );
}
