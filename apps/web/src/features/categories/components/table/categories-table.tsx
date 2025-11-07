import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { FolderOpen } from "lucide-react";
import type { Category } from "../../api";
import { CategoryRow } from "./category-row";

interface CategoriesTableProps {
  categories: Category[];
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
}: CategoriesTableProps) {
  if (categories.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <FolderOpen className="h-12 w-12 text-muted-foreground" />
          <EmptyTitle>Nenhuma categoria encontrada</EmptyTitle>
          <EmptyDescription>
            Comece criando uma nova categoria para organizar seu conteúdo.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="rounded-md border min-w-[800px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Conteúdos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
