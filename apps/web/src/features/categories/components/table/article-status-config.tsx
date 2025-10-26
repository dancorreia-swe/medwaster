import { Globe, FileEdit, Archive } from "lucide-react";

export const ARTICLE_STATUS_CONFIG = {
  published: {
    icon: Globe,
    label: "Publicado",
    variant: "default" as const,
  },
  draft: {
    icon: FileEdit,
    label: "Rascunho",
    variant: "secondary" as const,
  },
  archived: {
    icon: Archive,
    label: "Arquivado",
    variant: "outline" as const,
  },
} as const;

export function getStatusBadge(status: string) {
  const config =
    ARTICLE_STATUS_CONFIG[status as keyof typeof ARTICLE_STATUS_CONFIG];
  if (!config) return null;

  const StatusIcon = config.icon;

  return {
    icon: <StatusIcon className="h-3.5 w-3.5" />,
    label: config.label,
    variant: config.variant,
  };
}
