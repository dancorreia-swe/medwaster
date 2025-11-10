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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { useState } from "react";
import { ArticleListItem } from "./article-list-item";
import { QuestionListItem } from "./question-list-item";
import { formatDate } from "@/lib/utils";

const DEFAULT_COLOR = "#94a3b8";

interface TagRowProps {
  tag: {
    id: number;
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
  };
  onEdit?: (tag: any) => void;
  onDelete?: (tag: any) => void;
}

export function TagRow({ tag, onEdit, onDelete }: TagRowProps) {
  const [isOpen, setIsOpen] = useState(false);

  const articleCount = tag.wikiArticles?.length ?? 0;
  const questionCount = tag.questions?.length ?? 0;
  const totalContents = articleCount + questionCount;

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
        <TableCell>
          <div className="flex items-center justify-center w-full">
            <span
              aria-hidden
              className="inline-flex h-4 w-4 rounded-full border border-border"
              style={{ backgroundColor: tag.color || DEFAULT_COLOR }}
            />
          </div>
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{tag.name}</span>
            {tag.description && (
              <span className="text-xs text-muted-foreground">
                {tag.description}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
            {tag.slug}
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
              {totalContents === 0 && (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </TooltipProvider>
        </TableCell>
        <TableCell>
          <span className="text-sm text-muted-foreground">
            {formatDate(tag.createdAt)}
          </span>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir ações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => onEdit?.(tag)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete?.(tag)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {totalContents > 0 && isOpen && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={7} className="p-0 border-b-0">
            <div className="bg-muted/50 py-3">
              <div className="grid gap-2 px-4 sm:px-8 md:px-12 max-w-full">
                {tag.wikiArticles?.map((article) => (
                  <ArticleListItem key={`article-${article.id}`} article={article} />
                ))}
                {tag.questions?.map((question) => (
                  <QuestionListItem key={`question-${question.id}`} question={question} />
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
