import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { formatDate, stripHtml } from "@/lib/utils";
import { FileText } from "lucide-react";

interface ArticleListItemProps {
  article: {
    id: number;
    title: string;
    excerpt?: string | null;
    status: string;
    updatedAt: Date | string;
  };
}

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  draft: "secondary",
  published: "default",
  archived: "outline",
};

export function ArticleListItem({ article }: ArticleListItemProps) {
  const titleText = stripHtml(article.title);
  const excerptText = article.excerpt ? stripHtml(article.excerpt) : null;

  return (
    <Link
      to="/wiki/$articleId"
      params={{ articleId: article.id.toString() }}
      className="group flex items-center gap-3 rounded-lg border bg-background p-3 transition-all hover:border-primary hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
        <FileText className="h-5 w-5" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
            {titleText}
          </h4>
          <Badge
            variant={statusVariants[article.status] || "outline"}
            className="text-xs"
          >
            {statusLabels[article.status] || article.status}
          </Badge>
        </div>
        {excerptText && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {excerptText}
          </p>
        )}
        <span className="text-xs text-muted-foreground">
          {formatDate(article.updatedAt)}
        </span>
      </div>
    </Link>
  );
}
