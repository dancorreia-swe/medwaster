import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ColorPicker,
  ColorPickerSelection,
  ColorPickerHue,
  ColorPickerPreview,
  ColorPickerEyeDropper,
} from "@/components/ui/shadcn-io/color-picker";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  MoreVertical,
  Pencil,
  Calendar,
  Globe,
  FileEdit,
  Archive,
  Palette,
  ExternalLink,
} from "lucide-react";
import { useState, useRef } from "react";
import type { Category } from "../api";
import { Link } from "@tanstack/react-router";
import { useUpdateCategory } from "../hooks";
import { toast } from "sonner";
import Color from "color";

interface CategoriesTableProps {
  categories: Category[];
}

const ARTICLE_STATUS_CONFIG = {
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

function getStatusBadge(status: string) {
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

export function CategoriesTable({ categories }: CategoriesTableProps) {
  return (
    <div className="rounded-md border">
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
          {categories.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                Nenhuma categoria encontrada
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <CategoryRow key={category.id} category={category} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [isOpen, setIsOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [localColor, setLocalColor] = useState(category.color || "#3b82f6");
  const lastColorRef = useRef(localColor);
  const articleCount = category.wikiArticles?.length ?? 0;
  const totalContents = articleCount;

  const updateCategory = useUpdateCategory({ silent: true });

  const handleColorChange = async (rgba: number[] | string) => {
    let hex: string;

    if (Array.isArray(rgba)) {
      const color = Color.rgb(rgba[0], rgba[1], rgba[2], rgba[3] || 1);
      hex = color.hex();
    } else {
      hex = rgba;
    }

    // Only update if color actually changed
    if (hex === lastColorRef.current) return;

    lastColorRef.current = hex;
    const previousColor = localColor;

    // Optimistic update
    setLocalColor(hex);

    try {
      // Send to server
      await updateCategory.mutateAsync({
        id: category.id,
        color: hex,
      });
    } catch (error) {
      // Rollback on error
      setLocalColor(previousColor);
      lastColorRef.current = previousColor;
      toast.error("Erro ao atualizar cor da categoria");
      console.error(error);
    }
  };

  const displayColor = localColor;

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
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="h-5 w-5 rounded-full border-2 border-border hover:border-primary transition-colors cursor-pointer shrink-0 relative group"
                        style={{ backgroundColor: displayColor }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-full">
                          <Palette className="h-3 w-3 text-white" />
                        </div>
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Clique para alterar a cor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverContent
                className="w-56 p-4"
                align="start"
                onClick={(e) => e.stopPropagation()}
              >
                <ColorPicker
                  defaultValue={displayColor}
                  onChange={handleColorChange}
                  className="w-full"
                >
                  <div className="space-y-3">
                    <ColorPickerSelection className="h-32 w-full rounded-md" />
                    <ColorPickerHue className="w-full" />
                    <div className="flex items-center gap-2">
                      <ColorPickerEyeDropper />
                      <ColorPickerPreview
                        label="Cor selecionada"
                        className="w-full"
                      />
                    </div>
                  </div>
                </ColorPicker>
              </PopoverContent>
            </Popover>
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
          <Badge
            variant={category.isActive ? "default" : "secondary"}
            className="text-xs"
          >
            {category.isActive ? "Ativa" : "Inativa"}
          </Badge>
        </TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
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
                {category.isActive ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {totalContents > 0 && isOpen && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="p-0 border-b-0">
            <div className="bg-muted/50 px-12 py-3">
              <div className="grid gap-2">
                {category.wikiArticles?.map((article) => (
                  <Link
                    key={article.id}
                    to="/wiki/$articleId"
                    params={{ articleId: article.id.toString() }}
                    className="flex items-start gap-3 bg-background rounded-md p-3 border hover:border-primary/50 transition-colors group/article relative"
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

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover/article:text-primary transition-colors">
                        {article.title}
                      </p>
                      {article.excerpt && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {article.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <TooltipProvider>
                        {article.status &&
                          (() => {
                            const badge = getStatusBadge(article.status);
                            if (!badge) return null;

                            return (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Badge
                                      variant={badge.variant}
                                      className="cursor-help h-6 w-6 p-0 flex items-center justify-center"
                                    >
                                      {badge.icon}
                                    </Badge>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{badge.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })()}
                        {article.updatedAt && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {new Date(
                                    article.updatedAt,
                                  ).toLocaleDateString("pt-BR", {
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
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/80" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
