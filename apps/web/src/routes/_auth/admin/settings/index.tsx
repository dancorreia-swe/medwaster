import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildPageHead } from "@/lib/page-title";

const PAGE_TITLE = "Configurações";

export const Route = createFileRoute("/_auth/admin/settings/")({
  component: RouteComponent,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: () => ({ getTitle: () => PAGE_TITLE }),
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold md:text-3xl">Configurações</h1>
        <p className="text-sm text-muted-foreground md:max-w-2xl">
          Preferências gerais da plataforma.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              Nenhuma configuração disponível ainda
            </h2>
            <p className="text-sm text-muted-foreground">
              Esta área ainda está em construção. Enquanto isso, os ajustes de
              conta ficam no seu perfil.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/profile">Ir para Meu Perfil</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
