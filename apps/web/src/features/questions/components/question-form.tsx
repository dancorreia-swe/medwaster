import { useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
import { useCreateQuestion, useUpdateQuestion } from "../api/questionsApi";
import { questionQueryOptions } from "../api/questionsQueries";
import { categoriesListQueryOptions, tagsListQueryOptions } from "../api/categoriesAndTagsQueries";
import { usePermissions } from "@/components/auth/role-guard";
import { QuestionOptionsEditor } from "./question-options-editor";
import { QuestionFillBlanksEditor } from "./question-fill-blanks-editor";
import { QuestionMatchingEditor } from "./question-matching-editor";
import { ImageUpload } from "./image-upload";
import { Save, AlertCircle, X } from "lucide-react";
import { MinimalTiptap } from "@/components/ui/shadcn-io/minimal-tiptap";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  QUESTION_TYPE_OPTIONS,
  DIFFICULTY_LEVEL_OPTIONS,
  STATUS_OPTIONS,
  VALIDATION_MESSAGES,
} from "../constants";
import { validateQuestionForm } from "../validators";
import { useQuestionFormState } from "../hooks";
import type { QuestionType } from "../types";
import { Check, ChevronsUpDown, Loader2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface QuestionFormProps {
  questionId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function QuestionForm({ questionId, onSuccess, onCancel }: QuestionFormProps) {
  const { user } = usePermissions();
  const navigate = useNavigate();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion(questionId!);

  const isEditing = questionId !== undefined;

  // Fetch existing question data if editing
  const { data: existingQuestion, isLoading } = useQuery({
    ...questionQueryOptions(questionId!),
    enabled: isEditing,
  });

  // Fetch categories and tags
  const { data: categories = [], isLoading: categoriesLoading } = useQuery(categoriesListQueryOptions());
  const { data: tagsResponse, isLoading: tagsLoading } = useQuery(tagsListQueryOptions());
  const allTags = tagsResponse?.data || [];

  const [tagSearch, setTagSearch] = useState("");
  const debouncedTagSearch = useDebounce(tagSearch, 300);

  const {
    data: searchedTagsResponse,
    isFetching: isSearchingTags,
  } = useQuery({
    ...tagsListQueryOptions(
      debouncedTagSearch.trim()
        ? { search: debouncedTagSearch.trim(), keys: ["name", "slug"] }
        : undefined,
    ),
    enabled: debouncedTagSearch.trim().length > 0,
  });

  const filteredTags = debouncedTagSearch.trim().length > 0
    ? searchedTagsResponse?.data || []
    : allTags;

  // Selected tags state
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  const {
    questionType,
    options,
    fillBlanks,
    matchingPairs,
    validationErrors,
    setOptions,
    setFillBlanks,
    setMatchingPairs,
    setValidationErrors,
    handleTypeChange,
  } = useQuestionFormState((existingQuestion?.type as QuestionType) || "multiple_choice");

  const form = useForm({
    defaultValues: {
      prompt: "",
      explanation: "",
      difficulty: "basic" as const,
      status: "draft" as const,
      categoryId: null as number | null,
      imageUrl: "",
      imageKey: "",
      references: "",
    },
    onSubmit: async ({ value }) => {
      if (!user?.id) {
        setValidationErrors([VALIDATION_MESSAGES.AUTH_REQUIRED]);
        return;
      }

      const errors = validateQuestionForm(value, {
        questionType,
        options,
        fillBlanks,
        matchingPairs,
      });

      if (errors.length > 0) {
        setValidationErrors(errors);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      setValidationErrors([]);

      try {
        const questionData: any = {
          ...value,
          type: questionType,
          categoryId: value.categoryId || null,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        };

        if (questionType === "multiple_choice" || questionType === "true_false") {
          questionData.options = options;
        }

        if (questionType === "fill_in_the_blank") {
          questionData.fillInBlanks = fillBlanks;
        }

        if (questionType === "matching") {
          questionData.matchingPairs = matchingPairs;
        }

        if (isEditing) {
          await updateQuestion.mutateAsync(questionData);
          if (onSuccess) {
            onSuccess();
          } else {
            navigate({ to: "/questions/$questionId", params: { questionId: questionId.toString() } });
          }
        } else {
          await createQuestion.mutateAsync(questionData);
          if (onSuccess) {
            onSuccess();
          } else {
            navigate({ to: "/questions" });
          }
        }
      } catch (error) {
        setValidationErrors([VALIDATION_MESSAGES.CREATE_ERROR]);
        console.error("Error saving question:", error);
      }
    },
  });

  // Initialize form with existing data when editing
  useEffect(() => {
    if (existingQuestion && isEditing) {
      form.setFieldValue("prompt", existingQuestion.prompt || "");
      form.setFieldValue("explanation", existingQuestion.explanation || "");
      form.setFieldValue("difficulty", existingQuestion.difficulty as any);
      form.setFieldValue("status", existingQuestion.status as any);
      form.setFieldValue("categoryId", existingQuestion.categoryId || null);
      form.setFieldValue("imageUrl", existingQuestion.imageUrl || "");
      form.setFieldValue("imageKey", (existingQuestion as any).imageKey || "");
      form.setFieldValue("references", existingQuestion.references || "");

      if (existingQuestion.options) {
        setOptions(existingQuestion.options as any);
      }
      if (existingQuestion.fillInBlanks) {
        const normalizedBlanks = (existingQuestion.fillInBlanks as any).map((blank: any, index: number) => ({
          sequence: blank.sequence ?? index + 1,
          placeholder: blank.placeholder || "",
          answer: blank.answer,
          options: (blank.options ?? []).map((option: any) => ({
            text: option.text,
            isCorrect: option.isCorrect,
          })),
        }));
        setFillBlanks(normalizedBlanks as any);
      }
      if (existingQuestion.matchingPairs) {
        setMatchingPairs(existingQuestion.matchingPairs as any);
      }
      if (existingQuestion.tags) {
        const tagIds = existingQuestion.tags.map((t: any) => t.tag.id);
        setSelectedTagIds(tagIds);
      }
    }
  }, [existingQuestion, isEditing]);

  if (isEditing && isLoading) {
    return <QuestionFormSkeleton />;
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate({ to: "/questions" });
    }
  };

  return (
    <div className="space-y-6">
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">
              Corrija os seguintes erros:
            </div>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? `Editar Questão #${questionId}` : "Nova Questão"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Atualize as informações da questão" : "Preencha os campos abaixo para criar uma nova questão"}
          </p>
        </div>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "Salvando..." : isEditing ? "Atualizar Questão" : "Salvar Questão"}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </div>

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Informações Básicas</h2>

        <form.Field name="prompt">
          {(field) => (
            <div className="space-y-2 w-full">
              <Label htmlFor="prompt">Enunciado *</Label>
              <div className="w-full overflow-hidden">
                <MinimalTiptap
                  content={field.state.value}
                  onChange={(content) => field.handleChange(content)}
                  placeholder="Digite o enunciado da questão..."
                  className="min-h-[200px]"
                />
              </div>
            </div>
          )}
        </form.Field>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de Questão *</Label>
            <Select
              value={questionType}
              onValueChange={(v) => handleTypeChange(v as QuestionType)}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPE_OPTIONS.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" monochrome />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                O tipo não pode ser alterado após a criação
              </p>
            )}
          </div>

          <form.Field name="difficulty">
            {(field) => (
              <div className="space-y-2">
                <Label>Dificuldade *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIFFICULTY_LEVEL_OPTIONS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="status">
            {(field) => (
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <form.Field name="categoryId">
            {(field) => (
              <div className="space-y-2">
                <Label>Categoria</Label>
                {categoriesLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={field.state.value?.toString() || "none"}
                    onValueChange={(v) => field.handleChange(v === "none" ? null : Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </form.Field>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Tags
            </Label>
            {tagsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
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
                      placeholder="Buscar por nome, slug ou id..."
                      value={tagSearch}
                      onValueChange={setTagSearch}
                      autoFocus
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
                                      : [...prev, tag.id]
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="flex items-center gap-2">
                                  <span
                                    aria-hidden
                                    className="inline-flex h-3 w-3 rounded-full border border-border"
                                    style={{ backgroundColor: tag.color || "#6b7280" }}
                                  />
                                  <span className="flex flex-col leading-tight">
                                    <span>{tag.name}</span>
                                    {tag.slug && (
                                      <span className="text-[11px] text-muted-foreground">{tag.slug}</span>
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
            )}
            {selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTagIds.map((tagId) => {
                  const tag = allTags.find((t: any) => t.id === tagId) || filteredTags.find((t: any) => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <Badge
                      key={tagId}
                      variant="secondary"
                      className="gap-1 px-2 py-1"
                      style={
                        tag.color
                          ? {
                              backgroundColor: hexToRgba(tag.color, 0.12),
                              borderColor: hexToRgba(tag.color, 0.3),
                              color: tag.color,
                            }
                          : undefined
                      }
                    >
                      <span
                        aria-hidden
                        className="inline-flex h-2.5 w-2.5 rounded-full border border-border"
                        style={{ backgroundColor: tag.color || "#6b7280" }}
                      />
                      {tag.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
                        }}
                        className="ml-1 hover:bg-secondary-foreground/10 rounded-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <form.Field name="imageUrl">
          {(field) => (
            <ImageUpload
              value={field.state.value || undefined}
              onChange={(data) => {
                if (data) {
                  field.handleChange(data.url);
                  form.setFieldValue("imageKey", data.key);
                } else {
                  field.handleChange("");
                  form.setFieldValue("imageKey", "");
                }
              }}
              disabled={form.state.isSubmitting}
            />
          )}
        </form.Field>

        <form.Field name="explanation">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="explanation">Explicação</Label>
              <Textarea
                id="explanation"
                placeholder="Explicação da resposta correta..."
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          )}
        </form.Field>

        <form.Field name="references">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor="references">Referências</Label>
              <Input
                id="references"
                placeholder="Links ou fontes de referência..."
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
      </div>

      <div className="space-y-6 rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Configuração de Resposta</h2>

        {questionType === "multiple_choice" && (
          <QuestionOptionsEditor options={options} onChange={setOptions} />
        )}

        {questionType === "true_false" && (
          <QuestionOptionsEditor
            options={options}
            onChange={setOptions}
            isTrueFalse
          />
        )}

        {questionType === "fill_in_the_blank" && (
          <QuestionFillBlanksEditor
            blanks={fillBlanks}
            onChange={setFillBlanks}
          />
        )}

        {questionType === "matching" && (
          <QuestionMatchingEditor
            pairs={matchingPairs}
            onChange={setMatchingPairs}
          />
        )}
      </div>
    </div>
  );
}

function QuestionFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
