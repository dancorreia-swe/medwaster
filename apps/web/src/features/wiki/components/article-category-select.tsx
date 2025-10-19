import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Folder } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface ArticleCategorySelectProps {
  value: number | undefined;
  onChange: (categoryId: number | undefined) => void;
  categories: Category[];
  isLoading?: boolean;
}

export function ArticleCategorySelect({
  value,
  onChange,
  categories,
  isLoading,
}: ArticleCategorySelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Folder size={16} className="text-muted-foreground" />
      <span className="text-sm text-muted-foreground">em</span>

      <Select
        value={value ? String(value) : ""}
        onValueChange={(val) =>
          onChange(val ? Number.parseInt(val, 10) : undefined)
        }
      >
        <SelectTrigger className="h-8 w-48 border-0 p-0 focus:ring-0 focus:ring-offset-0">
          <SelectValue placeholder="Selecionar uma categoria" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Categorias</SelectLabel>
            {isLoading && (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Carregando...
              </div>
            )}
            {categories?.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
