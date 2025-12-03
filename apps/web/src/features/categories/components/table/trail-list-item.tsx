import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Map, Calendar, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { stripHtml } from "@/lib/utils";

interface TrailListItemProps {
  trail: {
    id: number;
    name: string;
    description?: string | null;
    difficulty?: string | null;
    status?: string | null;
    updatedAt?: string | Date | null;
  };
}

const getStatusBadge = (status: string) => {
  const badges = {
    draft: { label: "Rascunho", variant: "secondary" as const },
    published: { label: "Publicado", variant: "default" as const },
    inactive: { label: "Inativo", variant: "outline" as const },
    archived: { label: "Arquivado", variant: "outline" as const },
  };
  return badges[status as keyof typeof badges] || { label: status, variant: "default" as const };
};

const getDifficultyBadge = (difficulty: string) => {
  const badges = {
    basic: { label: "Básico", variant: "secondary" as const },
    intermediate: { label: "Intermediário", variant: "default" as const },
    advanced: { label: "Avançado", variant: "destructive" as const },
  };
  return badges[difficulty as keyof typeof badges] || { label: difficulty, variant: "default" as const };
};

export function TrailListItem({ trail }: TrailListItemProps) {
  const statusBadge = trail.status ? getStatusBadge(trail.status) : null;
  const difficultyBadge = trail.difficulty ? getDifficultyBadge(trail.difficulty) : null;
  const titleText = stripHtml(trail.name);
  const descriptionText = trail.description ? stripHtml(trail.description) : null;

  return (
    <Link
      to="/trails/$trailId"
      params={{ trailId: trail.id.toString() }}
      className="flex items-start gap-3 bg-background rounded-md p-3 border hover:border-primary/50 transition-colors group/trail relative overflow-hidden"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="shrink-0 mt-0.5">
              <Map className="h-4 w-4 text-muted-foreground" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Trilha</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex-1 min-w-0 w-full overflow-hidden">
        <p className="text-sm font-medium group-hover/trail:text-primary transition-colors truncate">
          {titleText}
        </p>
        {descriptionText && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 text-wrap max-w-2/3">
            {descriptionText}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <TooltipProvider>
          {statusBadge && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge variant={statusBadge.variant} className="text-xs">
                    {statusBadge.label}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Status</p>
              </TooltipContent>
            </Tooltip>
          )}
          {difficultyBadge && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Badge variant={difficultyBadge.variant} className="text-xs">
                    {difficultyBadge.label}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Dificuldade</p>
              </TooltipContent>
            </Tooltip>
          )}
          {trail.updatedAt && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(trail.updatedAt).toLocaleDateString("pt-BR", {
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

      <div className="absolute bottom-2 right-2 opacity-0 group-hover/trail:opacity-100 transition-opacity">
        <ExternalLink className="size-3 text-muted-foreground/80" />
      </div>
    </Link>
  );
}
