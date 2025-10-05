import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagsTable } from "@/features/tags/components/tags-table";
import type { TagTableItem } from "@/features/tags/components/tags-table";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";

const SAMPLE_TAGS: TagTableItem[] = [
  {
    id: 1,
    name: "Resíduos Infecciosos",
    slug: "residuos-infecciosos",
    description: "Materiais contaminados com sangue ou fluidos corporais.",
    color: "#e11d48",
    createdAt: "2024-04-12T10:15:00Z",
  },
  {
    id: 2,
    name: "Perfurocortantes",
    slug: "perfurocortantes",
    description: "Seringas, bisturis e objetos capazes de perfurar a pele.",
    color: "#0ea5e9",
    createdAt: "2024-03-08T08:32:00Z",
  },
  {
    id: 3,
    name: "Farmacêuticos",
    slug: "farmaceuticos",
    description: "Medicamentos vencidos ou não utilizados.",
    color: "#a855f7",
    createdAt: "2024-05-21T14:05:00Z",
  },
  {
    id: 4,
    name: "Químicos",
    slug: "quimicos",
    description: "Solventes e reagentes que exigem descarte especial.",
    color: "#f97316",
    createdAt: "2024-02-19T09:45:00Z",
  },
  {
    id: 5,
    name: "Radioativos",
    slug: "radioativos",
    description: "Materiais que emitem radiação ionizante em diagnósticos.",
    color: "#22c55e",
    createdAt: "2024-01-11T16:20:00Z",
  },
  {
    id: 6,
    name: "Patológicos",
    slug: "patologicos",
    description: "Tecidos humanos e órgãos destinados à incineração.",
    color: "#facc15",
    createdAt: "2024-06-02T12:10:00Z",
  },
];

export const Route = createFileRoute("/_auth/tags/")({
  component: TagsRoute,
  beforeLoad: () => ({ getTitle: () => "Tags" }),
});

function TagsRoute() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) return SAMPLE_TAGS;
    const query = searchTerm.toLowerCase();

    return SAMPLE_TAGS.filter((tag) =>
      [tag.name, tag.slug, tag.description]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query)),
    );
  }, [searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold md:text-3xl">Tags</h1>
          <p className="text-sm text-muted-foreground md:max-w-2xl mt-1">
            Organize e padronize as tags utilizadas em artigos, questões e
            outros conteúdos.
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova tag
        </Button>
      </header>

      <div className="flex flex-col gap-2">
        <label className="sr-only" htmlFor="tags-search">
          Buscar tags
        </label>
        <div className="relative w-full max-w-md">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            id="tags-search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar tags..."
            className="pl-9"
          />
        </div>
      </div>

      <TagsTable
        data={filteredTags}
        onEdit={(tag) => console.info("Editar tag", tag)}
        onDelete={(tag) => console.info("Excluir tag", tag)}
      />
    </div>
  );
}
