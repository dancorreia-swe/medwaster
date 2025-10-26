import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, FileText, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, useRef } from "react";
import type { Category, CategoryWikiArticle } from "../../api";
import { useDeleteCategory, useUpdateCategory } from "../../hooks";
import { toast } from "sonner";
import Color from "color";
import { CategoryColorPicker } from "./category-color-picker";
import { CategoryStatusDropdown } from "./category-status-dropdown";
import { ArticleListItem } from "./article-list-item";
import { DeleteCategoryDialog } from "./delete-category-dialog";

interface CategoryRowProps {
  category: Category;
}

export function CategoryRow({ category }: CategoryRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [localColor, setLocalColor] = useState(category.color || "#3b82f6");
  const [localIsActive, setLocalIsActive] = useState(category.isActive);
  const lastColorRef = useRef(localColor);
  const articleCount = category.wikiArticles?.length ?? 0;
  const totalContents = articleCount;

  const updateCategory = useUpdateCategory({ silent: true });
  const deleteCategory = useDeleteCategory();

  const handleColorChange = async (rgba: number[] | string) => {
    let hex: string;

    if (Array.isArray(rgba)) {
      const color = Color.rgb(rgba[0], rgba[1], rgba[2], rgba[3] || 1);
      hex = color.hex();
    } else {
      hex = rgba;
    }

    if (hex === lastColorRef.current) return;

    lastColorRef.current = hex;
    const previousColor = localColor;

    setLocalColor(hex);

    try {
      await updateCategory.mutateAsync({
        id: category.id,
        color: hex,
      });
    } catch (error) {
      setLocalColor(previousColor);
      lastColorRef.current = previousColor;
      toast.error("Erro ao atualizar cor da categoria");
      console.error(error);
    }
  };

  const handleStatusChange = async (isActive: boolean) => {
    if (isActive === localIsActive) return;

    const previousStatus = localIsActive;

    setLocalIsActive(isActive);
    setStatusDropdownOpen(false);

    try {
      await updateCategory.mutateAsync({
        id: category.id,
        isActive,
      });
    } catch (error) {
      setLocalIsActive(previousStatus);
      toast.error("Erro ao atualizar status da categoria");
      console.error(error);
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <TableRow
        className="group cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => totalContents > 0 && setIsOpen(!isOpen)}
      >
        <TableCell>
          {totalContents > 0 && (
            <div className="h-6 w-6 flex items-center justify-center">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <CategoryColorPicker
              color={localColor}
              isOpen={colorPickerOpen}
              onOpenChange={setColorPickerOpen}
              onChange={handleColorChange}
              onStopPropagation={stopPropagation}
            />
            <div className="flex flex-col">
              <span>{category.name}</span>
              {category.description && (
                <span className="text-xs text-muted-foreground font-normal">
                  {category.description}
                </span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <code className="text-xs bg-muted px-2 py-1 rounded">
            {category.slug}
          </code>
        </TableCell>
        <TableCell>
          <TooltipProvider>
            <div className="flex items-center gap-2">
              {articleCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
                      <FileText className="h-4 w-4" />
                      <span>{articleCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {articleCount} {articleCount === 1 ? "artigo" : "artigos"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {totalContents === 0 && (
                <span className="text-xs text-muted-foreground">
                  Nenhum conteúdo
                </span>
              )}
            </div>
          </TooltipProvider>
        </TableCell>
        <TableCell>
          <CategoryStatusDropdown
            isActive={localIsActive}
            isOpen={statusDropdownOpen}
            onOpenChange={setStatusDropdownOpen}
            onStatusChange={handleStatusChange}
            onStopPropagation={stopPropagation}
          />
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={stopPropagation}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {localIsActive ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {totalContents > 0 && isOpen && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="p-0 border-b-0">
            <div className="bg-muted/50 py-3">
              <div className="grid gap-2 px-4 sm:px-8 md:px-12 max-w-full">
                {category.wikiArticles?.map((article) => (
                  <ArticleListItem key={article.id} article={article} />
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}

      <DeleteCategoryDialog
        category={category}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={deleteCategory.isPending}
      />
    </>
  );
}
