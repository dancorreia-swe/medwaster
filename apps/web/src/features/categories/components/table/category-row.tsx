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
import {
  ChevronDown,
  ChevronRight,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  HelpCircle,
  ClipboardList,
  Map,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { Category, CategoryWikiArticle } from "../../api";
import { useDeleteCategory, useUpdateCategory } from "../../hooks";
import { toast } from "sonner";
import Color from "color";
import { CategoryColorPicker } from "./category-color-picker";
import { CategoryStatusDropdown } from "./category-status-dropdown";
import { ArticleListItem } from "./article-list-item";
import { QuestionListItem } from "./question-list-item";
import { QuizListItem } from "./quiz-list-item";
import { TrailListItem } from "./trail-list-item";
import { DeleteCategoryDialog } from "./delete-category-dialog";

interface CategoryRowProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

export function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [localColor, setLocalColor] = useState(category.color || "#3b82f6");
  const [localIsActive, setLocalIsActive] = useState(category.isActive);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const articleCount = category.wikiArticles?.length ?? 0;
  const questionCount = category.questions?.length ?? 0;
  const quizCount = category.quizzes?.length ?? 0;
  const trailCount = (category as any).trails?.length ?? 0;

  const totalContents = articleCount + questionCount + quizCount + trailCount;

  const updateCategory = useUpdateCategory({ silent: true, skipRefetch: true });
  const deleteCategory = useDeleteCategory();

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleColorChange = useCallback(
    (rgba: number[] | string) => {
      let hex: string;

      if (Array.isArray(rgba)) {
        const color = Color.rgb(rgba[0], rgba[1], rgba[2], rgba[3] || 1);
        hex = color.hex();
      } else {
        hex = rgba;
      }

      if (hex === localColor) return;

      setLocalColor(hex);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        updateCategory.mutate(
          {
            id: category.id,
            color: hex,
          },
          {
            onError: () => {
              setLocalColor(category.color || "#3b82f6");
              toast.error("Erro ao atualizar cor da categoria");
            },
          },
        );
      }, 500);
    },
    [localColor, category.id, category.color, updateCategory],
  );

  const handleStatusChange = useCallback(
    (isActive: boolean) => {
      if (isActive === localIsActive) return;

      setLocalIsActive(isActive);
      setStatusDropdownOpen(false);

      updateCategory.mutate(
        {
          id: category.id,
          isActive,
        },
        {
          onError: () => {
            setLocalIsActive(category.isActive);
            toast.error("Erro ao atualizar status da categoria");
          },
        },
      );
    },
    [localIsActive, category.id, category.isActive, updateCategory],
  );

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(category.id);
    } catch (error) {
      // Error is already handled by the hook's onError callback
      console.error(error);
    } finally {
      // Always close the dialog, whether success or error
      setDeleteDialogOpen(false);
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
              {questionCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
                      <HelpCircle className="h-4 w-4" />
                      <span>{questionCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {questionCount} {questionCount === 1 ? "questão" : "questões"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {quizCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
                      <ClipboardList className="h-4 w-4" />
                      <span>{quizCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {quizCount} {quizCount === 1 ? "quiz" : "quizzes"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {trailCount > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground cursor-help">
                      <Map className="h-4 w-4" />
                      <span>{trailCount}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {trailCount} {trailCount === 1 ? "trilha" : "trilhas"}
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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(category);
                }}
              >
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
                  if (onDelete) {
                    onDelete(category);
                  } else {
                    setDeleteDialogOpen(true);
                  }
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
                  <ArticleListItem key={`article-${article.id}`} article={article} />
                ))}
                {category.questions?.map((question) => (
                  <QuestionListItem key={`question-${question.id}`} question={question} />
                ))}
                {category.quizzes?.map((quiz) => (
                  <QuizListItem key={`quiz-${quiz.id}`} quiz={quiz} />
                ))}
                {(category as any).trails?.map((trail: any) => (
                  <TrailListItem key={`trail-${trail.id}`} trail={trail} />
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
