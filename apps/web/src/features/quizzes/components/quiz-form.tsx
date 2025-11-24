import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import {
  categoriesListQueryOptions,
  tagsListQueryOptions,
} from "@/features/questions/api/categoriesAndTagsQueries";
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
  Clock,
  Target,
  Hash,
  Settings,
  FileText,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  ChevronsUpDown,
  Loader2,
  X,
} from "lucide-react";
import { ImageUpload } from "@/features/questions/components/image-upload";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface QuizFormData {
  title: string;
  description: string;
  instructions: string;
  difficulty: "basic" | "intermediate" | "advanced" | "mixed";
  status: "draft" | "active" | "inactive" | "archived";
  categoryId?: number;
  timeLimit?: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  passingScore: number;
  imageUrl?: string;
  imageKey?: string;
  tagIds?: number[];
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface QuizFormProps {
  formData: QuizFormData;
  onChange: (data: Partial<QuizFormData>) => void;
  questionCount: number;
}

const difficultyOptions = [
  { value: "basic", label: "Básico", color: "bg-green-100 text-green-800" },
  {
    value: "intermediate",
    label: "Intermediário",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "advanced", label: "Avançado", color: "bg-red-100 text-red-800" },
  { value: "mixed", label: "Misto", color: "bg-purple-100 text-purple-800" },
];

const statusOptions = [
  { value: "draft", label: "Rascunho", color: "bg-gray-100 text-gray-800" },
  { value: "active", label: "Ativo", color: "bg-green-100 text-green-800" },
  {
    value: "inactive",
    label: "Inativo",
    color: "bg-yellow-100 text-yellow-800",
  },
  { value: "archived", label: "Arquivado", color: "bg-red-100 text-red-800" },
];

export function QuizForm({ formData, onChange, questionCount }: QuizFormProps) {
  const { data: categories = [] } = useQuery(categoriesListQueryOptions());
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const { data: allTags = [], isLoading: tagsLoading } = useQuery(
    tagsListQueryOptions(),
  );

  const [tagSearch, setTagSearch] = useState("");
  const debouncedTagSearch = useDebounce(tagSearch, 300);

  const { data: searchedTags = [], isFetching: isSearchingTags } = useQuery({
    ...tagsListQueryOptions(
      debouncedTagSearch.trim()
        ? { search: debouncedTagSearch.trim(), keys: ["name", "slug"] }
        : undefined,
    ),
    enabled: debouncedTagSearch.trim().length > 0,
  });

  const filteredTags =
    debouncedTagSearch.trim().length > 0 ? (searchedTags || []) : (allTags || []);

  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const selectedTagIds = formData.tagIds || [];

  const handleInputChange = (field: keyof QuizFormData, value: any) => {
    onChange({ [field]: value });
  };

  const handleTagsChange = (tagIds: number[]) => {
    handleInputChange("tagIds", tagIds);
  };

  const selectedDifficulty = difficultyOptions.find(
    (d) => d.value === formData.difficulty,
  );
  const selectedStatus = statusOptions.find((s) => s.value === formData.status);

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Digite o título do quiz"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrição do quiz"
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="instructions">Instruções</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) =>
                handleInputChange("instructions", e.target.value)
              }
              placeholder="Instruções para os alunos"
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <div>
            <ImageUpload
              label="Imagem do Quiz"
              value={formData.imageUrl}
              keyValue={formData.imageKey}
              uploadPath="/admin/quizzes/images/upload"
              deletePath="/admin/quizzes/images"
              onChange={(data) => {
                handleInputChange("imageUrl", data?.url || undefined);
                handleInputChange("imageKey", data?.key || undefined);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Classificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Dificuldade</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: any) =>
                handleInputChange("difficulty", value)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={option.color}>
                        {option.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => handleInputChange("status", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={option.color}>
                        {option.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categoria</Label>
            <Select
              value={formData.categoryId?.toString() || "none"}
              onValueChange={(value) =>
                handleInputChange(
                  "categoryId",
                  value === "none" ? undefined : Number(value),
                )
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Tags
            </Label>
            {tagsLoading ? (
              <div className="h-10 w-full animate-pulse bg-muted rounded" />
            ) : (
              <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isTagsOpen}
                    className="w-full justify-between font-normal mt-1"
                  >
                    {selectedTagIds.length > 0
                      ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? "s" : ""} selecionada${selectedTagIds.length > 1 ? "s" : ""}`
                      : "Selecione tags"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por nome, slug ou id..."
                      value={tagSearch}
                      onValueChange={setTagSearch}
                      autoFocus
                    />
                    <CommandList>
                      {isSearchingTags ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Buscando
                          tags...
                        </div>
                      ) : !filteredTags || filteredTags.length === 0 ? (
                        <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {(filteredTags || []).map((tag: any) => (
                            <CommandItem
                              key={tag.id}
                              value={`${tag.name} ${tag.slug ?? ""} ${tag.id}`}
                              keywords={[tag.slug, String(tag.id)].filter(
                                Boolean,
                              )}
                              onSelect={() => {
                                const newTagIds = selectedTagIds.includes(tag.id)
                                  ? selectedTagIds.filter((id) => id !== tag.id)
                                  : [...selectedTagIds, tag.id];
                                handleTagsChange(newTagIds);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedTagIds.includes(tag.id)
                                    ? "opacity-100"
                                    : "opacity-0",
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
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
            {selectedTagIds && selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTagIds.map((tagId) => {
                  const tag =
                    (allTags || []).find((t: any) => t.id === tagId) ||
                    (filteredTags || []).find((t: any) => t.id === tagId);
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
                          handleTagsChange(
                            selectedTagIds.filter((id) => id !== tagId),
                          );
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
        </CardContent>
      </Card>

      {/* Core Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Configurações Principais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label
              htmlFor="passingScore"
              className="text-sm font-medium mb-2 block"
            >
              Nota de Aprovação
            </Label>
            <NumberInput
              id="passingScore"
              value={formData.passingScore}
              onValueChange={(value) =>
                handleInputChange("passingScore", value || 0)
              }
              min={0}
              max={100}
              stepper={5}
              suffix="%"
              placeholder="70"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Porcentagem mínima necessária para aprovação
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 hover:bg-transparent"
              >
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="size-4" />
                  Configurações Avançadas
                </CardTitle>
                {isAdvancedOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-2">
              <div>
                <Label
                  htmlFor="timeLimit"
                  className="text-sm font-medium mb-2 flex items-center gap-2"
                >
                  <Clock className="h-3 w-3" />
                  Tempo Limite
                </Label>
                <NumberInput
                  id="timeLimit"
                  value={formData.timeLimit}
                  onValueChange={(value) =>
                    handleInputChange("timeLimit", value)
                  }
                  min={0}
                  max={600}
                  stepper={5}
                  suffix=" min"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Deixe em 0 para sem limite de tempo
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="showResults" className="text-sm font-medium">
                    Mostrar Resultados
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exibe a pontuação final ao aluno
                  </p>
                </div>
                <Switch
                  id="showResults"
                  checked={formData.showResults}
                  onCheckedChange={(checked) =>
                    handleInputChange("showResults", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="showCorrectAnswers"
                    className="text-sm font-medium"
                  >
                    Mostrar Respostas Corretas
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mostra as respostas corretas após submissão
                  </p>
                </div>
                <Switch
                  id="showCorrectAnswers"
                  checked={formData.showCorrectAnswers}
                  onCheckedChange={(checked) =>
                    handleInputChange("showCorrectAnswers", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="randomizeQuestions"
                    className="text-sm font-medium"
                  >
                    Randomizar Perguntas
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Altera a ordem das perguntas para cada tentativa
                  </p>
                </div>
                <Switch
                  id="randomizeQuestions"
                  checked={formData.randomizeQuestions}
                  onCheckedChange={(checked) =>
                    handleInputChange("randomizeQuestions", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="randomizeOptions"
                    className="text-sm font-medium"
                  >
                    Randomizar Opções
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Altera a ordem das opções de resposta
                  </p>
                </div>
                <Switch
                  id="randomizeOptions"
                  checked={formData.randomizeOptions}
                  onCheckedChange={(checked) =>
                    handleInputChange("randomizeOptions", checked)
                  }
                />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Quiz Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Perguntas:</span>
              <span className="font-medium">{questionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dificuldade:</span>
              <Badge variant="secondary" className={selectedDifficulty?.color}>
                {selectedDifficulty?.label}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="secondary" className={selectedStatus?.color}>
                {selectedStatus?.label}
              </Badge>
            </div>
            {formData.timeLimit && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo Limite:</span>
                <span className="font-medium">{formData.timeLimit} min</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
