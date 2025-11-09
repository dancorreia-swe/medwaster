import { useState, useEffect, useRef } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { TrailFormPage } from "../components/trail-form-page";
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
}

export function TrailBuilderPage({ mode, trailId }: TrailBuilderPageProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("basic");
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

  // Content Management
  const handleAddContent = async (
    contentType: ContentType,
    contentId: number,
    title: string,
    position: number,
  ) => {
    if (!localTrailId) {
      toast.error("Crie a trilha primeiro antes de adicionar conteúdo");
      return;
    }

    try {
      // Add the new content at the specified position
      await addContentMutation.mutateAsync({
        trailId: localTrailId,
        body: {
          contentType,
          contentId,
          sequence: position,
          isRequired: true,
        },
      });

      // If inserting in the middle, reorder all content after it
      if (position < localContent.length) {
        const contentUpdates = localContent
          .filter((item) => item.sequence >= position)
          .map((item) => ({
            contentId: item.id,
            sequence: item.sequence + 1,
          }));

        if (contentUpdates.length > 0) {
          await reorderContentMutation.mutateAsync({
            trailId: localTrailId,
            body: { contentUpdates },
          });
        }
      }

      refetchTrail();
      toast.success(`Conteúdo adicionado na posição ${position + 1}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar conteúdo");
    }
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

  const handleFinish = () => {
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
    <DndProvider backend={HTML5Backend}>
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
          {localTrailId && (
            <Button onClick={handleFinish}>
              <Save className="mr-2 h-4 w-4" />
              Finalizar
            </Button>
          )}
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
              mode={mode}
              trailId={localTrailId}
              onSave={mode === "create" ? handleCreateTrail : handleUpdateTrail}
              hideActions={false}
            />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Conteúdo da Trilha</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Adicione e organize questões, quizzes e artigos
                </p>
              </div>
              <ContentSelector
                onSelect={handleAddContent}
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

          <TabsContent value="prerequisites" className="space-y-6">
            <PrerequisitesSelector
              trailId={localTrailId}
              prerequisites={
                ((existingTrail as any)?.data || existingTrail)
                  ?.prerequisites || []
              }
              onAdd={handleAddPrerequisite}
              onRemove={handleRemovePrerequisite}
            />
          </TabsContent>
        </Tabs>
      </div>
    </DndProvider>
  );
}
