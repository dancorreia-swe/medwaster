import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_auth/wiki/new")({
  component: RouteComponent,
  beforeLoad() {
    return { getTitle: () => "Novo Artigo" };
  },
  head: () => ({
    meta: [
      { title: "Novo Artigo - Wiki | Medwaster" },
      {
        name: "description",
        content: "Criar novo artigo da base de conhecimento",
      },
    ],
  }),
});

function RouteComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/wiki", replace: true });
  }, [navigate]);

  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-semibold">Redirecionando...</h1>
      <p className="text-sm text-muted-foreground">
        Abra um novo artigo pelo botão na lista.
      </p>
    </div>
  );
}

