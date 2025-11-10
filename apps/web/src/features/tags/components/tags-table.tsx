import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Tag } from "lucide-react";
import { TagRow } from "./table/tag-row";

export interface TagTableItem {
  id: number | string;
  name: string;
  slug: string;
  description?: string | null;
  color?: string | null;
  createdAt?: Date | string | null;
  questions?: Array<{
    id: number;
    prompt: string;
    explanation?: string | null;
    type: string;
    difficulty: string;
    status: string;
    updatedAt: Date | string;
  }>;
  wikiArticles?: Array<{
    id: number;
    title: string;
    excerpt?: string | null;
    status: string;
    updatedAt: Date | string;
  }>;
}

interface TagsTableProps {
  data: TagTableItem[];
  onEdit?: (tag: TagTableItem) => void;
  onDelete?: (tag: TagTableItem) => void;
}

export function TagsTable({ data, onEdit, onDelete }: TagsTableProps) {
  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead className="w-12"></TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Identificador</TableHead>
            <TableHead>Conteúdo</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead className="w-20">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length ? (
            data.map((tag) => (
              <TagRow
                key={tag.id}
                tag={tag}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="p-6">
                <Empty className="py-10">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Tag className="size-5" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhuma tag encontrada</EmptyTitle>
                    <EmptyDescription>
                      Ajuste os filtros ou crie uma nova tag para começar.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
