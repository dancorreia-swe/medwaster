import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, BookOpen, HelpCircle, FileText, Check, Loader2, Tag as TagIcon, ChevronsUpDown, X, CheckCircle, Circle, Target, XCircle, FileQuestion } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { stripHtml, cn } from "@/lib/utils";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { questionsListQueryOptions } from "@/features/questions/api";
import { quizzesListQueryOptions } from "@/features/quizzes/api";
import { articlesQueryOptions } from "@/features/wiki/api/wikiQueries";
import { categoriesListQueryOptions, tagsListQueryOptions } from "@/features/questions/api/categoriesAndTagsQueries";
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
  questionType?: string; // Add questionType for specific icon rendering
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
  const [selectedItems, setSelectedItems] = useState<Map<string, ContentItem>>(new Map());

  // Filter states
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [difficulty, setDifficulty] = useState<string | undefined>(undefined);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(search, 300);
  const debouncedTagSearch = useDebounce(tagSearch, 300);

  // Fetch categories and tags
  const { data: categories = [] } = useQuery({
    ...categoriesListQueryOptions(),
    enabled: isOpen,
  });

  const { data: tagsResponse } = useQuery({
    ...tagsListQueryOptions(),
    enabled: isOpen,
  });
  const allTags = tagsResponse?.data || [];

  const { data: searchedTagsResponse, isFetching: isSearchingTags } = useQuery({
    ...tagsListQueryOptions(
      debouncedTagSearch.trim()
        ? { search: debouncedTagSearch.trim(), keys: ["name", "slug"] }
        : undefined,
    ),
    enabled: debouncedTagSearch.trim().length > 0 && isOpen,
  });

  const filteredTags =
    debouncedTagSearch.trim().length > 0
      ? searchedTagsResponse?.data || []
      : allTags;

  // Fetch content based on type
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    ...questionsListQueryOptions({
      search: debouncedSearch,
      status: ["active"],
      pageSize: 50,
      categoryId: categoryId,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
      difficulty: difficulty,
    }),
    enabled: contentType === "question" && isOpen,
  });

  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery({
    ...quizzesListQueryOptions({
      search: debouncedSearch,
      status: ["active"],
      pageSize: 50,
      categoryId: categoryId,
      difficulty: difficulty,
    }),
    enabled: contentType === "quiz" && isOpen,
  });

  const { data: articles, isLoading: isLoadingArticles } = useQuery({
    ...articlesQueryOptions({
      search: debouncedSearch,
      status: "published",
      limit: 50,
      categoryId: categoryId,
      tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
    }),
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
        title: stripHtml(q.prompt),
        type: "question" as ContentType,
        difficulty: q.difficulty,
        description: q.explanation ? stripHtml(q.explanation) : undefined,
        questionType: q.type, // Include question type
      }));
    }

    if (contentType === "quiz" && quizzes?.data) {
      return quizzes.data.map((q) => ({
        id: q.id,
        title: stripHtml(q.title),
        type: "quiz" as ContentType,
        difficulty: q.difficulty,
        description: q.description ? stripHtml(q.description) : undefined,
      }));
    }

    if (contentType === "article" && articles?.data?.data.articles) {
      return articles.data.data.articles.map((a: any) => ({
        id: a.id,
        title: stripHtml(a.title),
        type: "article" as ContentType,
        description: a.excerpt ? stripHtml(a.excerpt) : undefined,
      }));
    }

    return [];
  };

  const contentList = getContentList();
  const filteredContent = contentList.filter(
    (item) => !existingContentIds.get(item.type)?.has(item.id)
  );

  // Reset filters when changing content type
  const handleContentTypeChange = (newType: ContentType) => {
    setContentType(newType);
    setSearch("");
    setCategoryId(undefined);
    setSelectedTagIds([]);
    setDifficulty(undefined);
    setTagSearch("");
  };

  // Toggle difficulty filter
  const toggleDifficulty = (diff: string) => {
    setDifficulty((prev) => (prev === diff ? undefined : diff));
  };

  const toggleSelection = (item: ContentItem) => {
    const itemKey = `${item.type}-${item.id}`;
    setSelectedItems((prev) => {
      const newMap = new Map(prev);
      if (newMap.has(itemKey)) {
        newMap.delete(itemKey);
      } else {
        newMap.set(itemKey, item);
      }
      return newMap;
    });
  };

  const handleAddSelected = () => {
    if (selectedItems.size === 0) return;

    let position = existingContent.length;

    // Collect all items to add - now we have the full item data stored in the Map
    const itemsToAdd: Array<{ contentType: ContentType; contentId: number; title: string; position: number }> = [];

    selectedItems.forEach((item) => {
      itemsToAdd.push({ 
        contentType: item.type, 
        contentId: item.id, 
        title: item.title, 
        position 
      });
      position++;
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

    setSelectedItems(new Map());
    setSearch("");
    setIsOpen(false);
  };

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return <CheckCircle className="h-4 w-4" />;
      case "true_false":
        return <Circle className="h-4 w-4" />;
      case "fill_in_the_blank":
        return <Target className="h-4 w-4" />;
      case "matching":
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileQuestion className="h-4 w-4" />;
    }
  };

  const getIcon = (itemType: ContentType, questionType?: string) => {
    switch (itemType) {
      case "question":
        return questionType ? getQuestionTypeIcon(questionType) : <HelpCircle className="h-4 w-4" />;
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

        <Tabs value={contentType} onValueChange={(value) => handleContentTypeChange(value as ContentType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="question" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              Questões
              {(() => {
                const count = Array.from(selectedItems.values()).filter(item => item.type === "question").length;
                return count > 0 ? <Badge variant="secondary" className="ml-1">{count}</Badge> : null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Quizzes
              {(() => {
                const count = Array.from(selectedItems.values()).filter(item => item.type === "quiz").length;
                return count > 0 ? <Badge variant="secondary" className="ml-1">{count}</Badge> : null;
              })()}
            </TabsTrigger>
            <TabsTrigger value="article" className="gap-2">
              <FileText className="h-4 w-4" />
              Artigos
              {(() => {
                const count = Array.from(selectedItems.values()).filter(item => item.type === "article").length;
                return count > 0 ? <Badge variant="secondary" className="ml-1">{count}</Badge> : null;
              })()}
            </TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="question" className="space-y-4 mt-4">
            {/* Filters for Questions */}
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category-question">Categoria</Label>
                  <Select
                    value={categoryId?.toString() || "all"}
                    onValueChange={(value) => setCategoryId(value === "all" ? undefined : parseInt(value))}
                  >
                    <SelectTrigger id="category-question">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags-question" className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    Tags
                  </Label>
                  <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isTagsOpen}
                        className="w-full justify-between font-normal"
                      >
                        {selectedTagIds.length > 0
                          ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? "s" : ""} selecionada${selectedTagIds.length > 1 ? "s" : ""}`
                          : "Selecione tags"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar tags..."
                          value={tagSearch}
                          onValueChange={setTagSearch}
                        />
                        <CommandList>
                          {isSearchingTags ? (
                            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Buscando tags...
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                              <CommandGroup>
                                {filteredTags.map((tag: any) => (
                                  <CommandItem
                                    key={tag.id}
                                    value={`${tag.name} ${tag.slug ?? ""} ${tag.id}`}
                                    keywords={[tag.slug, String(tag.id)].filter(Boolean)}
                                    onSelect={() => {
                                      setSelectedTagIds((prev) =>
                                        prev.includes(tag.id)
                                          ? prev.filter((id) => id !== tag.id)
                                          : [...prev, tag.id],
                                      );
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <span className="flex items-center gap-2">
                                      <span
                                        aria-hidden
                                        className="inline-flex h-3 w-3 rounded-full border border-border"
                                        style={{
                                          backgroundColor: tag.color || "#6b7280",
                                        }}
                                      />
                                      <span className="flex flex-col leading-tight">
                                        <span>{tag.name}</span>
                                        {tag.slug && (
                                          <span className="text-[11px] text-muted-foreground">
                                            {tag.slug}
                                          </span>
                                        )}
                                      </span>
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedTagIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTagIds.map((tagId) => {
                        const tag = allTags.find((t: any) => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <Badge
                            key={tagId}
                            variant="secondary"
                            className="gap-1 px-2 py-1 cursor-pointer"
                            style={{
                              backgroundColor: tag.color ? `${tag.color}20` : undefined,
                              borderColor: tag.color || undefined,
                            }}
                            onClick={() => setSelectedTagIds(prev => prev.filter(id => id !== tagId))}
                          >
                            {tag.name}
                            <X className="h-3 w-3" />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <div className="flex gap-2">
                  <Badge
                    variant={difficulty === "basic" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDifficulty("basic")}
                  >
                    Básico
                  </Badge>
                  <Badge
                    variant={difficulty === "intermediate" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDifficulty("intermediate")}
                  >
                    Intermediário
                  </Badge>
                  <Badge
                    variant={difficulty === "advanced" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDifficulty("advanced")}
                  >
                    Avançado
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Pesquisar questões..."
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
                            {getIcon(item.type, item.questionType)}
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
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quiz" className="space-y-4 mt-4">
            {/* Filters for Quizzes */}
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category-quiz">Categoria</Label>
                  <Select
                    value={categoryId?.toString() || "all"}
                    onValueChange={(value) => setCategoryId(value === "all" ? undefined : parseInt(value))}
                  >
                    <SelectTrigger id="category-quiz">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dificuldade</Label>
                  <div className="flex gap-2">
                    <Badge
                      variant={difficulty === "basic" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDifficulty("basic")}
                    >
                      Básico
                    </Badge>
                    <Badge
                      variant={difficulty === "intermediate" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDifficulty("intermediate")}
                    >
                      Intermediário
                    </Badge>
                    <Badge
                      variant={difficulty === "advanced" ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDifficulty("advanced")}
                    >
                      Avançado
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-quiz">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search-quiz"
                    placeholder="Pesquisar quizzes..."
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
                            {getIcon(item.type, item.questionType)}
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
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="article" className="space-y-4 mt-4">
            {/* Filters for Articles */}
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category-article">Categoria</Label>
                  <Select
                    value={categoryId?.toString() || "all"}
                    onValueChange={(value) => setCategoryId(value === "all" ? undefined : parseInt(value))}
                  >
                    <SelectTrigger id="category-article">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags-article" className="flex items-center gap-2">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    Tags
                  </Label>
                  <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isTagsOpen}
                        className="w-full justify-between font-normal"
                      >
                        {selectedTagIds.length > 0
                          ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? "s" : ""} selecionada${selectedTagIds.length > 1 ? "s" : ""}`
                          : "Selecione tags"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar tags..."
                          value={tagSearch}
                          onValueChange={setTagSearch}
                        />
                        <CommandList>
                          {isSearchingTags ? (
                            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Buscando tags...
                            </div>
                          ) : (
                            <>
                              <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                              <CommandGroup>
                                {filteredTags.map((tag: any) => (
                                  <CommandItem
                                    key={tag.id}
                                    value={`${tag.name} ${tag.slug ?? ""} ${tag.id}`}
                                    keywords={[tag.slug, String(tag.id)].filter(Boolean)}
                                    onSelect={() => {
                                      setSelectedTagIds((prev) =>
                                        prev.includes(tag.id)
                                          ? prev.filter((id) => id !== tag.id)
                                          : [...prev, tag.id],
                                      );
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0",
                                      )}
                                    />
                                    <span className="flex items-center gap-2">
                                      <span
                                        aria-hidden
                                        className="inline-flex h-3 w-3 rounded-full border border-border"
                                        style={{
                                          backgroundColor: tag.color || "#6b7280",
                                        }}
                                      />
                                      <span className="flex flex-col leading-tight">
                                        <span>{tag.name}</span>
                                        {tag.slug && (
                                          <span className="text-[11px] text-muted-foreground">
                                            {tag.slug}
                                          </span>
                                        )}
                                      </span>
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedTagIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTagIds.map((tagId) => {
                        const tag = allTags.find((t: any) => t.id === tagId);
                        if (!tag) return null;
                        return (
                          <Badge
                            key={tagId}
                            variant="secondary"
                            className="gap-1 px-2 py-1 cursor-pointer"
                            style={{
                              backgroundColor: tag.color ? `${tag.color}20` : undefined,
                              borderColor: tag.color || undefined,
                            }}
                            onClick={() => setSelectedTagIds(prev => prev.filter(id => id !== tagId))}
                          >
                            {tag.name}
                            <X className="h-3 w-3" />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="search-article">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search-article"
                    placeholder="Pesquisar artigos..."
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
                            {getIcon(item.type, item.questionType)}
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
          </TabsContent>
        </Tabs>

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
                      selectedItems.forEach((item) => {
                        counts[item.type]++;
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
                  setSelectedItems(new Map());
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
      </DialogContent>
    </Dialog>
  );
}
