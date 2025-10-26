import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function EmptyState() {
  return (
    <div className="border rounded-lg p-10 text-center">
      <h3 className="text-lg font-semibold">Nenhum artigo encontrado</h3>
      <p className="text-sm text-slate-600 mt-1">
        Tente alterar os filtros ou criar um novo artigo.
      </p>
      <Button asChild className="mt-4">
        <Link to="/wiki">
          <Plus className="mr-2 h-4 w-4" /> Um novo artigo
        </Link>
      </Button>
    </div>
  );
}
