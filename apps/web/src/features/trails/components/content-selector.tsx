import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, BookOpen, HelpCircle, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  existingContentIds,
  existingContent,
}: ContentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [contentType, setContentType] = useState<ContentType>("question");
  const [search, setSearch] = useState("");
  const [insertPosition, setInsertPosition] = useState<string>("end");

  // Sort existing content by sequence for display
  const sortedExistingContent = [...existingContent].sort(
    (a, b) => a.sequence - b.sequence
  );

  // Fetch content based on type
  const { data: questions } = useQuery({
    ...questionsListQueryOptions({ search, status: ["active"], pageSize: 50 }),
    enabled: contentType === "question" && isOpen,
  });

  const { data: quizzes } = useQuery({
    ...quizzesListQueryOptions({ search, status: ["active"], pageSize: 50 }),
    enabled: contentType === "quiz" && isOpen,
  });

  const { data: articles } = useQuery({
    ...articlesQueryOptions({ search, status: "published", pageSize: 50 }),
    enabled: contentType === "article" && isOpen,
  });

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

    if (contentType === "article" && articles?.data) {
      return articles.data.map((a) => ({
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

  // Debug logging
  console.log('[ContentSelector] Debug:', {
    contentType,
    isOpen,
    questionsData: questions,
    quizzesData: quizzes,
    articlesData: articles,
    articlesRaw: JSON.stringify(articles),
    contentListLength: contentList.length,
    filteredContentLength: filteredContent.length,
  });

  const handleSelect = (item: ContentItem) => {
    const position = insertPosition === "end"
      ? sortedExistingContent.length
      : parseInt(insertPosition);
    onSelect(item.type, item.id, item.title, position);
    setSearch("");
    setInsertPosition("end");
    setIsOpen(false);
  };

  const getContentTitle = (content: TrailContent): string => {
    if (content.question) return content.question.prompt;
    if (content.quiz) return content.quiz.title;
    if (content.article) return content.article.title;
    return "Unknown";
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
      <DialogContent className="max-w-2xl">
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

          {sortedExistingContent.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="insert-position">Posição de Inserção</Label>
              <Select value={insertPosition} onValueChange={setInsertPosition}>
                <SelectTrigger id="insert-position">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    <span className="font-medium">1.</span> No início
                  </SelectItem>
                  {sortedExistingContent.map((content, index) => (
                    <SelectItem key={content.id} value={(index + 1).toString()}>
                      <span className="font-medium">{index + 2}.</span> Depois de:{" "}
                      {getContentTitle(content).substring(0, 35)}
                      {getContentTitle(content).length > 35 ? "..." : ""}
                    </SelectItem>
                  ))}
                  <SelectItem value="end">
                    <span className="font-medium">{sortedExistingContent.length + 1}.</span> No
                    final
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <ScrollArea className="h-[400px] rounded-md border">
            <div className="p-4 space-y-2">
              {filteredContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {contentList.length === 0
                    ? "Nenhum conteúdo encontrado"
                    : "Todos os itens já foram adicionados"}
                </div>
              ) : (
                filteredContent.map((item) => (
                  <Card
                    key={`${item.type}-${item.id}`}
                    className="p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1">{getIcon(item.type)}</div>
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
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
