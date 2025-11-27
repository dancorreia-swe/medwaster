import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { ChevronDown, ChevronUp } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/features/questions/components/image-upload";
import { categoriesListQueryOptions } from "@/features/questions/api/categoriesAndTagsQueries";
import { trailQueryOptions } from "../api/trailsQueries";
import type { CreateTrailBody } from "../types";

interface TrailFormPageProps {
  mode: "create" | "edit";
  trailId?: number;
  onSave?: (formData: CreateTrailBody) => Promise<any>;
}

export interface TrailFormHandle {
  submit: () => void;
  isDirty: boolean;
}

const trailStatusOptions = [
  { value: "draft", label: "Rascunho", color: "bg-gray-100 text-gray-800" },
  {
    value: "published",
    label: "Publicada",
    color: "bg-green-100 text-green-800",
  },
  {
    value: "inactive",
    label: "Inativa",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "archived", label: "Arquivada", color: "bg-red-100 text-red-800" },
];

export const TrailFormPage = forwardRef<TrailFormHandle, TrailFormPageProps>(
  function TrailFormPage({ mode, trailId, onSave }, ref) {
    // Fetch trail data if editing
    const { data: existingTrail, isLoading: isLoadingTrail } = useQuery({
      ...trailQueryOptions(trailId!),
      enabled: mode === "edit" && !!trailId,
    });

    // Fetch categories
    const { data: categories = [] } = useQuery(categoriesListQueryOptions());

    const [showAdvanced, setShowAdvanced] = useState(false);

    // Get initial values based on mode
    const trail =
      mode === "edit" && existingTrail
        ? (existingTrail as any).data || existingTrail
        : null;

    // Initialize TanStack Form
    const form = useForm<CreateTrailBody>({
      defaultValues: {
        name: trail?.name || "",
        description: trail?.description || undefined,
        categoryId: trail?.categoryId || undefined,
        difficulty: trail?.difficulty || "basic",
        status: trail?.status || "draft",
        passPercentage: trail?.passPercentage || 100,
        attemptsAllowed: trail?.attemptsAllowed || null,
        timeLimitMinutes: trail?.timeLimitMinutes || null,
        allowSkipQuestions: trail?.allowSkipQuestions ?? false,
        showImmediateExplanations: trail?.showImmediateExplanations ?? true,
        randomizeContentOrder: trail?.randomizeContentOrder ?? false,
        coverImageUrl: trail?.coverImageUrl || null,
        coverImageKey: (trail as any)?.coverImageKey || null,
        themeColor: trail?.themeColor || null,
        estimatedTimeMinutes: trail?.estimatedTimeMinutes || null,
      },
      onSubmit: async ({ value }) => {
        console.log("[TrailForm] onSubmit called with:", {
          mode,
          trailId,
          value,
        });

        // Clean the form data before submission
        const cleanedData: CreateTrailBody = {
          ...value,
          attemptsAllowed:
            value.attemptsAllowed && value.attemptsAllowed >= 1
              ? value.attemptsAllowed
              : null,
          timeLimitMinutes:
            value.timeLimitMinutes && value.timeLimitMinutes >= 1
              ? value.timeLimitMinutes
              : null,
          estimatedTimeMinutes:
            value.estimatedTimeMinutes && value.estimatedTimeMinutes >= 1
              ? value.estimatedTimeMinutes
              : null,
          categoryId: value.categoryId || null,
          description: value.description?.trim() || undefined,
        };

        console.log("[TrailForm] Cleaned data:", cleanedData);

        // The parent component handles the save logic via onSave
        if (onSave) {
          await onSave(cleanedData);
        }
      },
    });

    // Expose submit method to parent via ref
    useImperativeHandle(ref, () => ({
      submit: () => form.handleSubmit(),
      isDirty: form.state.isDirty,
    }));

    // Update form when trail data loads
    useEffect(() => {
      if (mode === "edit" && trail) {
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
    }, [mode, trail]);

    if (mode === "edit" && isLoadingTrail) {
      return <div>Carregando...</div>;
    }

    return (
      <div className="space-y-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("[TrailForm] Form submitted");
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Ex: Fundamentos de Cardiologia"
                      required
                    />
                  </div>
                )}
              />

              <form.Field
                name="description"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={field.state.value || ""}
                      onChange={(e) =>
                        field.handleChange(e.target.value || undefined)
                      }
                      onBlur={field.handleBlur}
                      placeholder="Descreva o objetivo e conteúdo desta trilha"
                      rows={3}
                    />
                  </div>
                )}
              />

              <form.Field name="coverImageUrl">
                {(field) => (
                  <ImageUpload
                    value={field.state.value || undefined}
                    onChange={(data) => {
                      if (data) {
                        field.handleChange(data.url);
                        form.setFieldValue("coverImageKey", data.key);
                      } else {
                        field.handleChange(null);
                        form.setFieldValue("coverImageKey", null);
                      }
                    }}
                    label="Imagem de Capa da Trilha"
                    uploadPath="/api/admin/trails/images/upload"
                    keyValue={form.getFieldValue("coverImageKey") || undefined}
                    deletePath="/api/admin/trails/images"
                  />
                )}
              </form.Field>

              <form.Field
                name="categoryId"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">Categoria</Label>
                    <Select
                      value={field.state.value?.toString() || ""}
                      onValueChange={(value) =>
                        field.handleChange(value ? parseInt(value) : undefined)
                      }
                    >
                      <SelectTrigger id="categoryId">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <form.Field
                  name="difficulty"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">
                        Dificuldade <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value: any) =>
                          field.handleChange(value)
                        }
                      >
                        <SelectTrigger id="difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Básico</SelectItem>
                          <SelectItem value="intermediate">
                            Intermediário
                          </SelectItem>
                          <SelectItem value="advanced">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />

                <form.Field
                  name="status"
                  children={(field) => (
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(value: any) =>
                          field.handleChange(value)
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {trailStatusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={option.color}
                                >
                                  {option.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <CardTitle className="text-base">
                Configurações Avançadas
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? (
                  <>
                    <ChevronUp className="mr-2 h-4 w-4" />
                    Ocultar
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Mostrar
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {showAdvanced && (
                <div className="space-y-4">
                  <form.Field
                    name="passPercentage"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="passPercentage">
                          Percentual de Aprovação (%)
                        </Label>
                        <Input
                          id="passPercentage"
                          type="number"
                          min="0"
                          max="100"
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(parseInt(e.target.value))
                          }
                          onBlur={field.handleBlur}
                        />
                        <p className="text-xs text-muted-foreground">
                          Padrão: 100%
                        </p>
                      </div>
                    )}
                  />

                  <form.Field
                    name="attemptsAllowed"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor="attemptsAllowed">
                          Tentativas Permitidas
                        </Label>
                        <Input
                          id="attemptsAllowed"
                          type="number"
                          min="1"
                          value={field.state.value ?? ""}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            const parsed = val === "" ? null : parseInt(val);
                            field.handleChange(
                              parsed !== null && !isNaN(parsed) && parsed >= 1
                                ? parsed
                                : null,
                            );
                          }}
                          onBlur={field.handleBlur}
                          placeholder="Ilimitado"
                        />
                        <p className="text-xs text-muted-foreground">
                          Deixe vazio para ilimitado
                        </p>
                      </div>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    );
  },
);
