import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileText, Calendar, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Category } from "../../api";
import { getStatusBadge } from "./article-status-config";

interface ArticleListItemProps {
  article: NonNullable<Category["wikiArticles"]>[number];
}

export function ArticleListItem({ article }: ArticleListItemProps) {
  const statusBadge = article.status ? getStatusBadge(article.status) : null;

  return (
    <Link
      to="/wiki/$articleId"
      params={{ articleId: article.id.toString() }}
      className="flex items-start gap-3 bg-background rounded-md p-3 border hover:border-primary/50 transition-colors group/article relative overflow-hidden"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0 mt-0.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Artigo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex-1 min-w-0 w-full overflow-hidden">
        <p className="text-sm font-medium group-hover/article:text-primary transition-colors truncate">
          {article.title}
        </p>
        {article.excerpt && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 text-wrap max-w-2/3">
            {article.excerpt}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <TooltipProvider>
          {statusBadge && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge
                    variant={statusBadge.variant}
                    className="cursor-help h-6 w-6 p-0 flex items-center justify-center"
                  >
                    {statusBadge.icon}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{statusBadge.label}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {article.updatedAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(article.updatedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Última atualização</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>

      <div className="absolute bottom-2 right-2 opacity-0 group-hover/article:opacity-100 transition-opacity">
        <ExternalLink className="size-3 text-muted-foreground/80" />
      </div>
    </Link>
  );
}
