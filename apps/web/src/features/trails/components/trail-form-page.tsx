import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { categoriesListQueryOptions } from "@/features/questions/api/categoriesAndTagsQueries";
import { useCreateTrail, useUpdateTrail, trailQueryOptions } from "../api/trailsQueries";
import type { CreateTrailBody, UpdateTrailBody, Trail } from "../types";

interface TrailFormPageProps {
  mode: "create" | "edit";
  trailId?: number;
  onSave?: (formData: CreateTrailBody) => Promise<any>;
  hideActions?: boolean;
}

export function TrailFormPage({ mode, trailId, onSave, hideActions = false }: TrailFormPageProps) {
  const navigate = useNavigate();
  const createMutation = useCreateTrail();
  const updateMutation = useUpdateTrail();

  // Fetch trail data if editing
  const { data: existingTrail, isLoading: isLoadingTrail } = useQuery({
    ...trailQueryOptions(trailId!),
    enabled: mode === "edit" && !!trailId,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery(categoriesListQueryOptions());

  // Form state
  const [formData, setFormData] = useState<CreateTrailBody>({
    name: "",
    difficulty: "basic",
    status: "draft",
    passPercentage: 100,
    attemptsAllowed: null,
    allowSkipQuestions: false,
    showImmediateExplanations: true,
    randomizeContentOrder: false,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update form data when existing trail loads
  useEffect(() => {
    if (mode === "edit" && existingTrail) {
      const trail = (existingTrail as any).data || existingTrail;
      setFormData({
        name: trail.name,
        description: trail.description || undefined,
        categoryId: trail.categoryId,
        difficulty: trail.difficulty,
        status: trail.status,
        passPercentage: trail.passPercentage,
        attemptsAllowed: trail.attemptsAllowed,
        timeLimitMinutes: trail.timeLimitMinutes,
        allowSkipQuestions: trail.allowSkipQuestions,
        showImmediateExplanations: trail.showImmediateExplanations,
        randomizeContentOrder: trail.randomizeContentOrder,
        coverImageUrl: trail.coverImageUrl,
        themeColor: trail.themeColor,
        estimatedTimeMinutes: trail.estimatedTimeMinutes,
      });
      
      // Show advanced section if any advanced field has non-default value
      if (
        trail.passPercentage !== 100 ||
        trail.attemptsAllowed !== null ||
        trail.timeLimitMinutes ||
        trail.estimatedTimeMinutes
      ) {
        setShowAdvanced(true);
      }
    }
  }, [mode, existingTrail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Clean the form data before submission
      const cleanedData = {
        ...formData,
        attemptsAllowed: formData.attemptsAllowed && formData.attemptsAllowed >= 1 ? formData.attemptsAllowed : null,
        timeLimitMinutes: formData.timeLimitMinutes && formData.timeLimitMinutes >= 1 ? formData.timeLimitMinutes : null,
        estimatedTimeMinutes: formData.estimatedTimeMinutes && formData.estimatedTimeMinutes >= 1 ? formData.estimatedTimeMinutes : null,
        categoryId: formData.categoryId || null,
        description: formData.description?.trim() || undefined,
      };

      if (onSave) {
        // When using custom onSave (from builder), don't navigate
        await onSave(cleanedData);
        return;
      }

      // Standalone form behavior (direct routes)
      if (mode === "create") {
        const result = await createMutation.mutateAsync(cleanedData);
        navigate({
          to: "/trails/$trailId/edit",
          params: { trailId: result.data.id.toString() },
        });
      } else if (trailId) {
        await updateMutation.mutateAsync({
          id: trailId,
          body: cleanedData as UpdateTrailBody,
        });
        navigate({ to: "/trails" });
      }
    } catch (error) {
      console.error("Error saving trail:", error);
    }
  };

  const handleCancel = () => {
    navigate({ to: "/trails" });
  };

  if (mode === "edit" && isLoadingTrail) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {!hideActions && !onSave && (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Nova Trilha" : "Editar Trilha"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Crie uma nova trilha de aprendizado"
                : "Atualize as informações da trilha"}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nome da trilha"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    description: e.target.value || undefined 
                  });
                }}
                placeholder="Descreva o objetivo e conteúdo desta trilha"
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="difficulty">
                  Dificuldade <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, difficulty: value })
                  }
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Básico</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="archived">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <Select
                  value={formData.categoryId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      categoryId: value ? parseInt(value) : null,
                    })
                  }
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowSkipQuestions">Permitir Pular Questões</Label>
                  <p className="text-sm text-muted-foreground">
                    Estudantes podem pular questões opcionais
                  </p>
                </div>
                <Switch
                  id="allowSkipQuestions"
                  checked={formData.allowSkipQuestions}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allowSkipQuestions: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="showImmediateExplanations">
                    Mostrar Explicações Imediatas
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir explicações logo após cada resposta
                  </p>
                </div>
                <Switch
                  id="showImmediateExplanations"
                  checked={formData.showImmediateExplanations}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      showImmediateExplanations: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="randomizeContentOrder">
                    Randomizar Ordem do Conteúdo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Embaralhar a ordem dos conteúdos para cada estudante
                  </p>
                </div>
                <Switch
                  id="randomizeContentOrder"
                  checked={formData.randomizeContentOrder}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, randomizeContentOrder: checked })
                  }
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                <span className="font-medium">Configurações Avançadas</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="passPercentage">
                        Percentual de Aprovação (%)
                      </Label>
                      <Input
                        id="passPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.passPercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passPercentage: parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Padrão: 100%
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="attemptsAllowed">Tentativas Permitidas</Label>
                      <Input
                        id="attemptsAllowed"
                        type="number"
                        min="1"
                        value={formData.attemptsAllowed ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const parsed = val === "" ? null : parseInt(val);
                          setFormData({
                            ...formData,
                            attemptsAllowed: parsed !== null && !isNaN(parsed) && parsed >= 1
                              ? parsed
                              : null,
                          });
                        }}
                        placeholder="Ilimitado"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio para ilimitado
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeLimitMinutes">Tempo Limite (minutos)</Label>
                      <Input
                        id="timeLimitMinutes"
                        type="number"
                        min="1"
                        value={formData.timeLimitMinutes ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const parsed = val === "" ? null : parseInt(val);
                          setFormData({
                            ...formData,
                            timeLimitMinutes: parsed !== null && !isNaN(parsed) && parsed >= 1
                              ? parsed
                              : null,
                          });
                        }}
                        placeholder="Sem limite"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio para sem limite
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimatedTimeMinutes">
                        Tempo Estimado (minutos)
                      </Label>
                      <Input
                        id="estimatedTimeMinutes"
                        type="number"
                        min="1"
                        value={formData.estimatedTimeMinutes ?? ""}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          const parsed = val === "" ? null : parseInt(val);
                          setFormData({
                            ...formData,
                            estimatedTimeMinutes: parsed !== null && !isNaN(parsed) && parsed >= 1
                              ? parsed
                              : null,
                          });
                        }}
                        placeholder="Não estimado"
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio para não exibir estimativa
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {(!hideActions || onSave) && (
          <div className="flex justify-end gap-4">
            {!onSave && (
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {mode === "create" ? "Criar Trilha" : "Salvar Alterações"}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
