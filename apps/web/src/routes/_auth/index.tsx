import { authClient } from "@/lib/auth-client";
import { Dashboard } from "@/components/admin-dashboard";
import { createFileRoute } from "@tanstack/react-router";
import { client } from "@/lib/client";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Painel Administrativo";

export const Route = createFileRoute("/_auth/")({
  component: RouteComponent,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad() {
    return { getTitle: () => PAGE_TITLE };
  },
});

function RouteComponent() {
  const { isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-slate-600">
            Carregando painel administrativo...
          </p>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}
