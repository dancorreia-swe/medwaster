import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { achievementsApi } from "../api/achievementsApi";
import { achievementQueryOptions } from "../api/achievementQueries";
import { BadgeDesigner } from "./badge-designer";
import { trailsListQueryOptions } from "@/features/trails/api/trailsQueries";
import { categoriesQueryOptions } from "@/features/wiki/api/wikiQueries";

interface AchievementFormProps {
  achievementId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const achievementFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome deve ter no máximo 255 caracteres"),
  description: z.string().min(1, "Descrição é obrigatória").max(500, "Descrição deve ter no máximo 500 caracteres"),
  category: z.enum(["trails", "wiki", "questions", "certification", "engagement", "general"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  status: z.enum(["active", "inactive", "archived"]),
  triggerType: z.string().min(1, "Tipo de gatilho é obrigatório"),
  targetCount: z.number().optional(),
  targetResourceId: z.string().optional(),
  targetAccuracy: z.number().optional(),
  targetTimeSeconds: z.number().optional(),
  targetStreakDays: z.number().optional(),
  requirePerfectScore: z.boolean(),
  requireSequential: z.boolean(),
  badgeIcon: z.string().min(1, "Ícone é obrigatório"),
  badgeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
  badgeImageUrl: z.string().optional(),
  customMessage: z.string().optional(),
  displayOrder: z.number(),
  isSecret: z.boolean(),
});

type AchievementFormData = z.infer<typeof achievementFormSchema>;

const categories = [
  { value: "trails", label: "Trilhas" },
  { value: "wiki", label: "Wiki" },
  { value: "questions", label: "Questões" },
  { value: "certification", label: "Certificação" },
  { value: "engagement", label: "Engajamento" },
  { value: "general", label: "Geral" },
] as const;

const difficulties = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Médio" },
  { value: "hard", label: "Difícil" },
] as const;

const statuses = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "archived", label: "Arquivado" },
] as const;

const triggerTypes = [
  { value: "complete_trails", label: "Completar Trilhas" },
  { value: "complete_specific_trail", label: "Completar Trilha Específica" },
  { value: "complete_trails_perfect", label: "Completar Trilhas Perfeitamente" },
  { value: "complete_trails_sequence", label: "Completar Trilhas em Sequência" },
  { value: "read_category_complete", label: "Ler Categoria Completa" },
  { value: "read_articles_count", label: "Ler Quantidade de Artigos" },
  { value: "read_time_total", label: "Tempo Total de Leitura" },
  { value: "read_specific_article", label: "Ler Artigo Específico" },
  { value: "bookmark_articles_count", label: "Favoritar Artigos" },
  { value: "question_streak_correct", label: "Sequência de Acertos" },
  { value: "questions_answered_count", label: "Questões Respondidas" },
  { value: "question_accuracy_rate", label: "Taxa de Acurácia" },
  { value: "answer_hard_question", label: "Responder Questão Difícil" },
  { value: "complete_quiz_count", label: "Completar Questionários" },
  { value: "first_certificate", label: "Primeiro Certificado" },
  { value: "certificate_high_score", label: "Certificado com Nota Alta" },
  { value: "certificate_fast_approval", label: "Aprovação Rápida" },
  { value: "onboarding_complete", label: "Completar Onboarding" },
  { value: "first_login", label: "Primeiro Login" },
  { value: "login_streak", label: "Sequência de Logins" },
  { value: "use_ai_assistant", label: "Usar Assistente IA" },
  { value: "manual", label: "Manual" },
] as const;

export function AchievementForm({
  achievementId,
  onSuccess,
  onCancel,
}: AchievementFormProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const isEditing = achievementId !== undefined;

  const { data: achievementData, isPending: isLoading } = useQuery({
    ...achievementQueryOptions(achievementId!),
    enabled: isEditing,
  });

  // Fetch trails for trail-related triggers
  const { data: trailsData } = useQuery({
    ...trailsListQueryOptions({ status: ["published"], pageSize: 100 }),
  });

  // Fetch categories for category-related triggers
  const { data: categoriesData } = useQuery(categoriesQueryOptions());

  const createMutation = useMutation({
    mutationFn: achievementsApi.createAchievement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast.success("Conquista criada com sucesso!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao criar conquista");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      achievementsApi.updateAchievement(achievementId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      queryClient.invalidateQueries({
        queryKey: ["achievements", achievementId],
      });
      toast.success("Conquista atualizada com sucesso!");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Erro ao atualizar conquista");
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "general" as const,
      difficulty: "medium" as const,
      status: "active" as const,
      triggerType: "manual",
      targetCount: undefined as number | undefined,
      targetResourceId: undefined as string | undefined,
      targetAccuracy: undefined as number | undefined,
      targetTimeSeconds: undefined as number | undefined,
      targetStreakDays: undefined as number | undefined,
      requirePerfectScore: false,
      requireSequential: false,
      badgeIcon: "trophy",
      badgeColor: "#fbbf24",
      badgeImageUrl: undefined as string | undefined,
      customMessage: undefined as string | undefined,
      displayOrder: 0,
      isSecret: false,
    },
    onSubmit: async ({ value }) => {
      const payload = {
        name: value.name,
        description: value.description,
        category: value.category,
        difficulty: value.difficulty,
        status: value.status,
        triggerType: value.triggerType,
        targetCount: value.targetCount,
        targetResourceId: value.targetResourceId,
        targetAccuracy: value.targetAccuracy,
        targetTimeSeconds: value.targetTimeSeconds,
        targetStreakDays: value.targetStreakDays,
        requirePerfectScore: value.requirePerfectScore,
        requireSequential: value.requireSequential,
        badgeIcon: value.badgeIcon,
        badgeColor: value.badgeColor,
        badgeImageUrl: value.badgeImageUrl,
        customMessage: value.customMessage,
        displayOrder: value.displayOrder,
        isSecret: value.isSecret,
      };

      if (isEditing) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
    },
    validatorAdapter: zodValidator(),
  });

  useEffect(() => {
    if (achievementData?.data) {
      const achievement = achievementData.data;
      form.setFieldValue("name", achievement.name || "");
      form.setFieldValue("description", achievement.description || "");
      form.setFieldValue("category", achievement.category || "general");
      form.setFieldValue("difficulty", achievement.difficulty || "medium");
      form.setFieldValue("status", achievement.status || "active");
      form.setFieldValue("triggerType", achievement.triggerType || "manual");
      form.setFieldValue("targetCount", achievement.targetCount);
      form.setFieldValue("targetResourceId", achievement.targetResourceId);
      form.setFieldValue("targetAccuracy", achievement.targetAccuracy);
      form.setFieldValue("targetTimeSeconds", achievement.targetTimeSeconds);
      form.setFieldValue("targetStreakDays", achievement.targetStreakDays);
      form.setFieldValue("requirePerfectScore", achievement.requirePerfectScore || false);
      form.setFieldValue("requireSequential", achievement.requireSequential || false);
      form.setFieldValue("badgeIcon", achievement.badgeIcon || "trophy");
      form.setFieldValue("badgeColor", achievement.badgeColor || "#fbbf24");
      form.setFieldValue("badgeImageUrl", achievement.badgeImageUrl);
      form.setFieldValue("customMessage", achievement.customMessage);
      form.setFieldValue("displayOrder", achievement.displayOrder || 0);
      form.setFieldValue("isSecret", achievement.isSecret || false);
    }
  }, [achievementData, form]);

  if (isEditing && isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* Toolbar */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: "/achievements" })}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="border-l pl-4">
              <h1 className="text-sm font-medium">
                {isEditing ? "Editar Conquista" : "Nova Conquista"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isFormSubmitting]) => (
                <Button
                  size="sm"
                  onClick={() => form.handleSubmit()}
                  disabled={!canSubmit || isSaving || isFormSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving || isFormSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-8"
        >
          {/* Basic Information */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Informações Básicas</h2>
            </div>
            <Separator />

            <div className="space-y-4">
              <form.Field
                name="name"
                validators={{
                  onChange: achievementFormSchema.shape.name,
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Ex: Primeiro Passo"
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error} className="text-sm text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="description"
                validators={{
                  onChange: achievementFormSchema.shape.description,
                }}
              >
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Descrição <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Descreva como desbloquear esta conquista..."
                      rows={4}
                    />
                    {field.state.meta.errors.map((error) => (
                      <p key={error} className="text-sm text-destructive">
                        {error}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>

              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="category">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        Categoria <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.state.meta.errors.map((error) => (
                        <p key={error} className="text-sm text-destructive">
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>

                <form.Field name="difficulty">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Dificuldade</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {difficulties.map((diff) => (
                            <SelectItem key={diff.value} value={diff.value}>
                              {diff.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
              </div>
            </div>
          </section>

          {/* Trigger Configuration */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Configuração do Gatilho</h2>
              <p className="text-sm text-muted-foreground">
                Defina quando e como esta conquista será desbloqueada
              </p>
            </div>
            <Separator />

            <div className="space-y-4">
              <form.Field name="triggerType">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>
                      Tipo de Gatilho <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerTypes.map((trigger) => (
                          <SelectItem key={trigger.value} value={trigger.value}>
                            {trigger.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state) => state.values.triggerType}>
                {(triggerType) => (
                  <>
                    {(triggerType === "complete_trails" ||
                      triggerType === "read_articles_count" ||
                      triggerType === "questions_answered_count" ||
                      triggerType === "bookmark_articles_count" ||
                      triggerType === "complete_quiz_count") && (
                      <form.Field name="targetCount">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>Quantidade Alvo</Label>
                            <Input
                              id={field.name}
                              type="number"
                              value={field.state.value ?? ""}
                              onChange={(e) =>
                                field.handleChange(
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                              placeholder="Ex: 10"
                            />
                          </div>
                        )}
                      </form.Field>
                    )}

                    {triggerType === "complete_specific_trail" && (
                      <form.Field name="targetResourceId">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>Trilha Específica</Label>
                            <Select
                              value={field.state.value ?? ""}
                              onValueChange={(v) => field.handleChange(v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma trilha" />
                              </SelectTrigger>
                              <SelectContent>
                                {trailsData?.data?.map((trail: any) => (
                                  <SelectItem key={trail.id} value={trail.id.toString()}>
                                    {trail.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Selecione a trilha que deve ser completada
                            </p>
                          </div>
                        )}
                      </form.Field>
                    )}

                    {triggerType === "read_category_complete" && (
                      <form.Field name="targetResourceId">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>Categoria</Label>
                            <Select
                              value={field.state.value ?? ""}
                              onValueChange={(v) => field.handleChange(v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoriesData?.data?.map((category: any) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Selecione a categoria que deve ser completada
                            </p>
                          </div>
                        )}
                      </form.Field>
                    )}

                    {triggerType === "read_specific_article" && (
                      <form.Field name="targetResourceId">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>ID do Artigo Específico</Label>
                            <Input
                              id={field.name}
                              value={field.state.value ?? ""}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="ID do artigo"
                            />
                            <p className="text-xs text-muted-foreground">
                              Digite o ID do artigo específico
                            </p>
                          </div>
                        )}
                      </form.Field>
                    )}

                    {(triggerType === "question_accuracy_rate" ||
                      triggerType === "certificate_high_score") && (
                      <form.Field name="targetAccuracy">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>Taxa de Acurácia Alvo (%)</Label>
                            <Input
                              id={field.name}
                              type="number"
                              step="0.01"
                              value={field.state.value ?? ""}
                              onChange={(e) =>
                                field.handleChange(
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                              placeholder="Ex: 85.5"
                            />
                          </div>
                        )}
                      </form.Field>
                    )}

                    {(triggerType === "read_time_total" ||
                      triggerType === "certificate_fast_approval") && (
                      <form.Field name="targetTimeSeconds">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>Tempo Alvo (segundos)</Label>
                            <Input
                              id={field.name}
                              type="number"
                              value={field.state.value ?? ""}
                              onChange={(e) =>
                                field.handleChange(
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                              placeholder="Ex: 3600"
                            />
                          </div>
                        )}
                      </form.Field>
                    )}

                    {(triggerType === "question_streak_correct" ||
                      triggerType === "login_streak") && (
                      <form.Field name="targetStreakDays">
                        {(field) => (
                          <div className="space-y-2">
                            <Label htmlFor={field.name}>Sequência Alvo (dias)</Label>
                            <Input
                              id={field.name}
                              type="number"
                              value={field.state.value ?? ""}
                              onChange={(e) =>
                                field.handleChange(
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                              placeholder="Ex: 7"
                            />
                          </div>
                        )}
                      </form.Field>
                    )}

                    {triggerType === "complete_trails_perfect" && (
                      <form.Field name="requirePerfectScore">
                        {(field) => (
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <Label>Requer Pontuação Perfeita</Label>
                              <p className="text-sm text-muted-foreground">
                                Exige 100% de acertos
                              </p>
                            </div>
                            <Switch
                              checked={field.state.value}
                              onCheckedChange={(checked) => field.handleChange(checked)}
                            />
                          </div>
                        )}
                      </form.Field>
                    )}

                    {triggerType === "complete_trails_sequence" && (
                      <form.Field name="requireSequential">
                        {(field) => (
                          <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <Label>Requer Sequencial</Label>
                              <p className="text-sm text-muted-foreground">
                                Deve completar em sequência
                              </p>
                            </div>
                            <Switch
                              checked={field.state.value}
                              onCheckedChange={(checked) => field.handleChange(checked)}
                            />
                          </div>
                        )}
                      </form.Field>
                    )}
                  </>
                )}
              </form.Subscribe>
            </div>
          </section>

          {/* Badge Customization */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Personalização do Badge</h2>
              <p className="text-sm text-muted-foreground">
                Customize a aparência visual do badge da conquista
              </p>
            </div>
            <Separator />

            <form.Subscribe
              selector={(state) => ({
                badgeIcon: state.values.badgeIcon,
                badgeColor: state.values.badgeColor,
                badgeImageUrl: state.values.badgeImageUrl,
              })}
            >
              {({ badgeIcon, badgeColor, badgeImageUrl }) => (
                <BadgeDesigner
                  badgeIcon={badgeIcon}
                  badgeColor={badgeColor}
                  badgeImageUrl={badgeImageUrl}
                  onBadgeIconChange={(icon) => form.setFieldValue("badgeIcon", icon)}
                  onBadgeColorChange={(color) => form.setFieldValue("badgeColor", color)}
                  onBadgeImageUrlChange={(url) =>
                    form.setFieldValue("badgeImageUrl", url)
                  }
                />
              )}
            </form.Subscribe>

            <div className="pt-4">
              <form.Field name="customMessage">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Mensagem Personalizada</Label>
                    <Textarea
                      id={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value || undefined)}
                      placeholder="Mensagem exibida ao desbloquear a conquista..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Opcional: mensagem especial mostrada quando o usuário ganha a conquista
                    </p>
                  </div>
                )}
              </form.Field>
            </div>
          </section>

          {/* Additional Settings */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Configurações Adicionais</h2>
              <p className="text-sm text-muted-foreground">
                Ajustes de status, ordem e visibilidade
              </p>
            </div>
            <Separator />

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <form.Field name="status">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Status</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((stat) => (
                            <SelectItem key={stat.value} value={stat.value}>
                              {stat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>

                <form.Field name="displayOrder">
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>Ordem de Exibição</Label>
                      <Input
                        id={field.name}
                        type="number"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Menor número aparece primeiro
                      </p>
                    </div>
                  )}
                </form.Field>
              </div>

              <form.Field name="isSecret">
                {(field) => (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={field.name}>Conquista Secreta</Label>
                      <p className="text-sm text-muted-foreground">
                        Ocultar conquista até ser desbloqueada
                      </p>
                    </div>
                    <Switch
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked)}
                    />
                  </div>
                )}
              </form.Field>
            </div>
          </section>
        </form>
      </div>
    </>
  );
}
