import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { BookText } from "lucide-react";

export function EmptyState() {
  return (
    <Empty className="border rounded-lg">
      <EmptyHeader>
        <BookText className="h-8 w-8 text-muted-foreground" />
        <EmptyTitle>Nenhum artigo encontrado</EmptyTitle>
        <EmptyDescription>
          Ajuste os filtros ou tente buscar novamente para encontrar conteúdos.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
