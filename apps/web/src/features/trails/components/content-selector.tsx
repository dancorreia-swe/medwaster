import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, BookOpen, HelpCircle, FileText, Check, Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { questionsListQueryOptions } from "@/features/questions/api";
import { quizzesListQueryOptions } from "@/features/quizzes/api";
import { articlesQueryOptions } from "@/features/wiki/api/wikiQueries";
import type { ContentType, TrailContent } from "../types";

interface ContentSelectorProps {
  onSelect: (contentType: ContentType, contentId: number, title: string, position: number) => void;
  onBatchSelect?: (items: Array<{ contentType: ContentType; contentId: number; title: string; position: number }>) => void;
  existingContentIds: Map<ContentType, Set<number>>;
  existingContent: TrailContent[];
}

type ContentItem = {
  id: number;
  title: string;
  type: ContentType;
  difficulty?: string;
  description?: string;
};

export function ContentSelector({
  onSelect,
  onBatchSelect,
  existingContentIds,
  existingContent,
}: ContentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("question");
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(search, 300);

  // Fetch content based on type
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    ...questionsListQueryOptions({ search: debouncedSearch, status: ["active"], pageSize: 50 }),
    enabled: contentType === "question" && isOpen,
  });

  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery({
    ...quizzesListQueryOptions({ search: debouncedSearch, status: ["active"], pageSize: 50 }),
    enabled: contentType === "quiz" && isOpen,
  });

  const { data: articles, isLoading: isLoadingArticles } = useQuery({
    ...articlesQueryOptions({ search: debouncedSearch, status: "published", limit: 50 }),
    enabled: contentType === "article" && isOpen,
  });

  const isLoading =
    (contentType === "question" && isLoadingQuestions) ||
    (contentType === "quiz" && isLoadingQuizzes) ||
    (contentType === "article" && isLoadingArticles);

  const getContentList = (): ContentItem[] => {
    if (contentType === "question" && questions?.data) {
      return questions.data.map((q) => ({
        id: q.id,
        title: q.prompt,
        type: "question" as ContentType,
        difficulty: q.difficulty,
        description: q.explanation || undefined,
      }));
    }

    if (contentType === "quiz" && quizzes?.data) {
      return quizzes.data.map((q) => ({
        id: q.id,
        title: q.title,
        type: "quiz" as ContentType,
        difficulty: q.difficulty,
        description: q.description || undefined,
      }));
    }

    if (contentType === "article" && articles?.data?.data.articles) {
      return articles.data.data.articles.map((a: any) => ({
        id: a.id,
        title: a.title,
        type: "article" as ContentType,
        description: a.excerpt || undefined,
      }));
    }

    return [];
  };

  const contentList = getContentList();
  const filteredContent = contentList.filter(
    (item) => !existingContentIds.get(item.type)?.has(item.id)
  );

  const toggleSelection = (item: ContentItem) => {
    const itemKey = `${item.type}-${item.id}`;
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const handleAddSelected = () => {
    if (selectedItems.size === 0) return;

    let position = existingContent.length;

    // Collect all items to add
    const itemsToAdd: Array<{ contentType: ContentType; contentId: number; title: string; position: number }> = [];

    selectedItems.forEach((itemKey) => {
      const [type, idStr] = itemKey.split('-');
      const id = parseInt(idStr);
      const item = contentList.find(i => i.type === type && i.id === id);

      if (item) {
        itemsToAdd.push({ contentType: item.type, contentId: item.id, title: item.title, position });
        position++;
      }
    });

    // Use batch select if available for better performance
    if (onBatchSelect && itemsToAdd.length > 1) {
      onBatchSelect(itemsToAdd);
    } else {
      // Fallback to individual adds
      itemsToAdd.forEach(({ contentType, contentId, title, position }) => {
        onSelect(contentType, contentId, title, position);
      });
    }

    setSelectedItems(new Set());
    setSearch("");
    setIsOpen(false);
  };

  const getIcon = (type: ContentType) => {
    switch (type) {
      case "question":
        return <HelpCircle className="h-4 w-4" />;
      case "quiz":
        return <BookOpen className="h-4 w-4" />;
      case "article":
        return <FileText className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "basic":
        return "secondary";
      case "intermediate":
        return "default";
      case "advanced":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Conteúdo
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Adicionar Conteúdo à Trilha</DialogTitle>
          <DialogDescription>
            Selecione questões, quizzes ou artigos para adicionar à trilha
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="content-type">Tipo de Conteúdo</Label>
              <Select
                value={contentType}
                onValueChange={(value) => {
                  setContentType(value as ContentType);
                  setSearch("");
                }}
              >
                <SelectTrigger id="content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="question">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Questão
                    </div>
                  </SelectItem>
                  <SelectItem value="quiz">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Quiz
                    </div>
                  </SelectItem>
                  <SelectItem value="article">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Artigo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={`Pesquisar ${
                    contentType === "question"
                      ? "questões"
                      : contentType === "quiz"
                      ? "quizzes"
                      : "artigos"
                  }...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                  </div>
                </div>
              ) : filteredContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {contentList.length === 0
                    ? "Nenhum conteúdo encontrado"
                    : "Todos os itens já foram adicionados"}
                </div>
              ) : (
                filteredContent.map((item) => {
                  const itemKey = `${item.type}-${item.id}`;
                  const isSelected = selectedItems.has(itemKey);

                  return (
                    <Card
                      key={itemKey}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? "bg-accent border-primary" : "hover:bg-accent"
                      }`}
                      onClick={() => toggleSelection(item)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="mt-1 flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelection(item)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            {getIcon(item.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium line-clamp-2 text-sm">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {item.difficulty && (
                                <Badge
                                  variant={getDifficultyColor(item.difficulty)}
                                  className="text-xs"
                                >
                                  {item.difficulty === "basic"
                                    ? "Básico"
                                    : item.difficulty === "intermediate"
                                    ? "Intermediário"
                                    : "Avançado"}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {selectedItems.size > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {selectedItems.size} {selectedItems.size === 1 ? "item selecionado" : "itens selecionados"}
                  </span>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const counts = { question: 0, quiz: 0, article: 0 };
                      selectedItems.forEach((key) => {
                        const [type] = key.split('-');
                        counts[type as ContentType]++;
                      });
                      return (
                        <>
                          {counts.question > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <HelpCircle className="h-3 w-3" />
                              {counts.question}
                            </Badge>
                          )}
                          {counts.quiz > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <BookOpen className="h-3 w-3" />
                              {counts.quiz}
                            </Badge>
                          )}
                          {counts.article > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />
                              {counts.article}
                            </Badge>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <span>Nenhum item selecionado</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedItems(new Set());
                  setSearch("");
                  setIsOpen(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedItems.size === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar {selectedItems.size > 0 ? `(${selectedItems.size})` : ""}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
