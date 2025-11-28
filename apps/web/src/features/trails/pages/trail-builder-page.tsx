import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { TrailFormPage, type TrailFormHandle } from "../components/trail-form-page";
import { ContentSelector } from "../components/content-selector";
import { TrailContentList } from "../components/trail-content-list";
import { PrerequisitesSelector } from "../components/prerequisites-selector";
import {
  trailQueryOptions,
  useCreateTrail,
  useUpdateTrail,
  useAddContent,
  useRemoveContent,
  useReorderContent,
  useAddPrerequisite,
  useRemovePrerequisite,
  useUpdateContent,
} from "../api/trailsQueries";
import type {
  Trail,
  TrailContent,
  ContentType,
  CreateTrailBody,
} from "../types";

interface TrailBuilderPageProps {
  mode: "create" | "edit";
  trailId?: number;
  initialTab?: string;
}

interface ContentToAdd {
  contentType: ContentType;
  contentId: number;
  title: string;
  position: number;
}

export function TrailBuilderPage({ mode, trailId, initialTab }: TrailBuilderPageProps) {
  const navigate = useNavigate();
  const formRef = useRef<TrailFormHandle>(null);
  const [activeTab, setActiveTab] = useState(initialTab || "basic");
  const [localTrailId, setLocalTrailId] = useState<number | undefined>(trailId);
  const [localContent, setLocalContent] = useState<TrailContent[]>([]);

  // Mutations
  const createMutation = useCreateTrail();
  const updateMutation = useUpdateTrail();
  const addContentMutation = useAddContent();
  const removeContentMutation = useRemoveContent();
  const reorderContentMutation = useReorderContent();
  const updateContentMutation = useUpdateContent();
  const addPrerequisiteMutation = useAddPrerequisite();
  const removePrerequisiteMutation = useRemovePrerequisite();

  // Fetch existing trail data for edit mode
  const {
    data: existingTrail,
    isLoading: isLoadingTrail,
    refetch: refetchTrail,
  } = useQuery({
    ...trailQueryOptions(localTrailId!),
    enabled: !!localTrailId,
  });

  // Keep tab selection in sync with URL + availability.
  useEffect(() => {
    const requested = initialTab || "basic";
    const isUnlockedTab =
      requested === "basic" ||
      (!!localTrailId &&
        (requested === "content" || requested === "prerequisites"));

    const nextTab = isUnlockedTab ? requested : "basic";
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
  }, [initialTab, localTrailId]);

  // Update local content when trail data loads
  useEffect(() => {
    const trail = (existingTrail as any)?.data || existingTrail;
    if (trail?.content) {
      setLocalContent(trail.content);
    }
  }, [existingTrail]);

  const handleCreateTrail = async (formData: CreateTrailBody) => {
    try {
      const result = await createMutation.mutateAsync(formData);
      const newTrailId = result.data.id;
      setLocalTrailId(newTrailId);

      // Refetch the newly created trail to populate the form with server data
      await refetchTrail();

      toast.success("Trilha criada! Agora adicione conteúdo.");
      setActiveTab("content");
      return newTrailId;
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar trilha");
      throw error;
    }
  };

  const handleUpdateTrail = async (formData: CreateTrailBody) => {
    if (!localTrailId) return;

    try {
      await updateMutation.mutateAsync({
        id: localTrailId,
        body: formData,
      });
      toast.success("Informações da trilha atualizadas!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar trilha");
      throw error;
    }
  };

  // Batch add content with optimistic updates
  const handleAddMultipleContent = async (items: ContentToAdd[]) => {
    if (!localTrailId) {
      toast.error("Crie a trilha primeiro antes de adicionar conteúdo");
      return;
    }

    if (items.length === 0) return;

    // Create optimistic content items
    const optimisticItems: TrailContent[] = items.map((item, index) => ({
      id: -1 - index, // Temporary negative IDs for optimistic items
      trailId: localTrailId,
      contentType: item.contentType,
      questionId: item.contentType === "question" ? item.contentId : null,
      quizId: item.contentType === "quiz" ? item.contentId : null,
      articleId: item.contentType === "article" ? item.contentId : null,
      sequence: item.position + index,
      isRequired: true,
      createdAt: new Date().toISOString(),
      // Mock the nested objects
      question: item.contentType === "question" ? { id: item.contentId, prompt: item.title } as any : null,
      quiz: item.contentType === "quiz" ? { id: item.contentId, title: item.title } as any : null,
      article: item.contentType === "article" ? { id: item.contentId, title: item.title } as any : null,
    }));

    // Optimistically update the UI
    const previousContent = localContent;
    setLocalContent([...localContent, ...optimisticItems]);

    toast.loading(`Adicionando ${items.length} ${items.length === 1 ? "item" : "itens"}...`, { id: "batch-add" });

    // Add all items in parallel
    const results = await Promise.allSettled(
      items.map((item) =>
        addContentMutation.mutateAsync({
          trailId: localTrailId,
          body: {
            contentType: item.contentType,
            contentId: item.contentId,
            sequence: item.position,
            isRequired: true,
          },
        })
      )
    );

    // Check results
    const failures = results.filter((r) => r.status === "rejected");
    const successes = results.filter((r) => r.status === "fulfilled");

    if (failures.length > 0) {
      // Rollback to previous state on any failure
      setLocalContent(previousContent);
      toast.error(`Erro ao adicionar ${failures.length} ${failures.length === 1 ? "item" : "itens"}`, { id: "batch-add" });
      console.error("Failed additions:", failures);
    } else {
      toast.success(`${successes.length} ${successes.length === 1 ? "item adicionado" : "itens adicionados"}!`, { id: "batch-add" });
    }

    // Refetch to get the real data
    refetchTrail();
  };

  // Content Management (single item - kept for compatibility)
  const handleAddContent = async (
    contentType: ContentType,
    contentId: number,
    title: string,
    position: number,
  ) => {
    handleAddMultipleContent([{ contentType, contentId, title, position }]);
  };

  const handleRemoveContent = async (contentId: number) => {
    if (!localTrailId) return;

    try {
      await removeContentMutation.mutateAsync({
        trailId: localTrailId,
        contentId,
      });
      refetchTrail();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover conteúdo");
    }
  };

  const handleReorderContent = async (reorderedContent: TrailContent[]) => {
    if (!localTrailId) return;

    // Update local state immediately for smooth UX
    setLocalContent(reorderedContent);

    try {
      const contentUpdates = reorderedContent.map((item, index) => ({
        contentId: item.id,
        sequence: index,
      }));

      await reorderContentMutation.mutateAsync({
        trailId: localTrailId,
        body: { contentUpdates },
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao reordenar conteúdo");
      // Revert on error
      if (existingTrail?.content) {
        setLocalContent(existingTrail.content);
      }
    }
  };

  const handleToggleRequired = async (contentId: number) => {
    if (!localTrailId) return;

    const content = localContent.find((c) => c.id === contentId);
    if (!content) return;

    try {
      await updateContentMutation.mutateAsync({
        trailId: localTrailId,
        contentId,
        body: {
          isRequired: !content.isRequired,
        },
      });
      refetchTrail();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar conteúdo");
    }
  };

  // Prerequisites Management
  const handleAddPrerequisite = async (prerequisiteTrailId: number) => {
    if (!localTrailId) return;

    try {
      await addPrerequisiteMutation.mutateAsync({
        trailId: localTrailId,
        body: { prerequisiteTrailId },
      });
      refetchTrail();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar pré-requisito");
    }
  };

  const handleAddMultiplePrerequisites = async (prerequisiteTrailIds: number[]) => {
    if (!localTrailId || prerequisiteTrailIds.length === 0) return;

    toast.loading(
      `Adicionando ${prerequisiteTrailIds.length} ${prerequisiteTrailIds.length === 1 ? "pré-requisito" : "pré-requisitos"}...`,
      { id: "batch-add-prereq" }
    );

    // Add all prerequisites in parallel
    const results = await Promise.allSettled(
      prerequisiteTrailIds.map((prerequisiteTrailId) =>
        addPrerequisiteMutation.mutateAsync({
          trailId: localTrailId,
          body: { prerequisiteTrailId },
        })
      )
    );

    // Check results
    const failures = results.filter((r) => r.status === "rejected");
    const successes = results.filter((r) => r.status === "fulfilled");

    if (failures.length > 0) {
      toast.error(
        `Erro ao adicionar ${failures.length} ${failures.length === 1 ? "pré-requisito" : "pré-requisitos"}`,
        { id: "batch-add-prereq" }
      );
      console.error("Failed additions:", failures);
    } else {
      toast.success(
        `${successes.length} ${successes.length === 1 ? "pré-requisito adicionado" : "pré-requisitos adicionados"}!`,
        { id: "batch-add-prereq" }
      );
    }

    // Refetch to get the real data
    refetchTrail();
  };

  const handleRemovePrerequisite = async (prerequisiteTrailId: number) => {
    if (!localTrailId) return;

    try {
      await removePrerequisiteMutation.mutateAsync({
        trailId: localTrailId,
        prerequisiteId: prerequisiteTrailId,
      });
      refetchTrail();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover pré-requisito");
    }
  };

  const handleCancel = () => {
    navigate({ to: "/trails" });
  };

  const handleSave = async () => {
    // If on basic tab or creating a new trail, trigger form submission
    if ((activeTab === "basic" || !localTrailId) && formRef.current) {
      formRef.current.submit();
      return;
    }

    // For other tabs (content/prerequisites), all changes are auto-saved
    // Just show success and navigate back
    toast.success("Trilha salva com sucesso!");
    navigate({ to: "/trails" });
  };

  // Get existing content IDs for the selector
  const existingContentIds = new Map<ContentType, Set<number>>();
  localContent.forEach((content) => {
    if (content.questionId) {
      if (!existingContentIds.has("question")) {
        existingContentIds.set("question", new Set());
      }
      existingContentIds.get("question")!.add(content.questionId);
    }
    if (content.quizId) {
      if (!existingContentIds.has("quiz")) {
        existingContentIds.set("quiz", new Set());
      }
      existingContentIds.get("quiz")!.add(content.quizId);
    }
    if (content.articleId) {
      if (!existingContentIds.has("article")) {
        existingContentIds.set("article", new Set());
      }
      existingContentIds.get("article")!.add(content.articleId);
    }
  });

  if (mode === "edit" && isLoadingTrail) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Nova Trilha" : "Editar Trilha"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Crie uma nova trilha de aprendizado"
                : ((existingTrail as any)?.data || existingTrail)?.name}
            </p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {!localTrailId ? "Criar Trilha" : "Salvar"}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="content" disabled={!localTrailId}>
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="prerequisites" disabled={!localTrailId}>
              Pré-requisitos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            {mode === "create" && !localTrailId && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  Preencha as informações básicas e clique em{" "}
                  <strong>Criar Trilha</strong> para desbloquear as abas de
                  conteúdo e pré-requisitos.
                </p>
              </div>
            )}
            <TrailFormPage
              ref={formRef}
              mode={mode}
              trailId={localTrailId}
              onSave={mode === "create" ? handleCreateTrail : handleUpdateTrail}
              hasContent={localContent.length > 0}
            />
          </TabsContent>

          <TabsContent value="content" className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">Conteúdo da Trilha</h2>
                  <Badge variant="secondary" className="text-sm">
                    {localContent.length} {localContent.length === 1 ? "item" : "itens"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione e organize questões, quizzes e artigos
                </p>
              </div>
              <ContentSelector
                onSelect={handleAddContent}
                onBatchSelect={handleAddMultipleContent}
                existingContentIds={existingContentIds}
                existingContent={localContent}
              />
            </div>

            <TrailContentList
              content={localContent}
              onReorder={handleReorderContent}
              onRemove={handleRemoveContent}
              onToggleRequired={handleToggleRequired}
            />
          </TabsContent>

          <TabsContent value="prerequisites" className="space-y-6 pt-4">
            <PrerequisitesSelector
              trailId={localTrailId}
              prerequisites={
                ((existingTrail as any)?.data || existingTrail)
                  ?.prerequisites || []
              }
              onAdd={handleAddPrerequisite}
              onBatchAdd={handleAddMultiplePrerequisites}
              onRemove={handleRemovePrerequisite}
            />
          </TabsContent>
        </Tabs>
      </div>
  );
}
