import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import {
  QUIZ_DIFFICULTY_OPTIONS,
  QUIZ_STATUS_OPTIONS,
  type QuizFormData,
} from "../types";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface QuizSettingsProps {
  formData: QuizFormData;
  onChange: (data: Partial<QuizFormData>) => void;
  totalPoints: number;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-6 first:pt-0">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        disabled && "opacity-50",
      )}
    >
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="mt-0.5"
      />
    </div>
  );
}

/**
 * Everything that governs how the quiz behaves, as opposed to what it says.
 * Lives in a sheet: authors set these once, then spend their time on questions.
 */
export function QuizSettings({
  formData,
  onChange,
  totalPoints,
}: QuizSettingsProps) {
  const { data: categories = [] } = useQuery(categoriesListQueryOptions());
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
    debouncedTagSearch.trim().length > 0 ? searchedTags || [] : allTags || [];

  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const selectedTagIds = formData.tagIds || [];

  // The passing score is a percentage, but authors grade in points. Show what
  // it resolves to against the questions currently in the quiz.
  const pointsToPass =
    totalPoints > 0
      ? Math.ceil((formData.passingScore / 100) * totalPoints)
      : null;

  return (
    <div className="divide-y divide-border">
      <Section title="Publicação">
        <Field label="Status">
          <Select
            value={formData.status}
            onValueChange={(value) =>
              onChange({ status: value as QuizFormData["status"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUIZ_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Dificuldade">
          <Select
            value={formData.difficulty}
            onValueChange={(value) =>
              onChange({ difficulty: value as QuizFormData["difficulty"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUIZ_DIFFICULTY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Categoria">
          <Select
            value={formData.categoryId?.toString() || "none"}
            onValueChange={(value) =>
              onChange({
                categoryId: value === "none" ? undefined : Number(value),
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma categoria</SelectItem>
              {categories.map((category: { id: number; name: string }) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Tags">
          {tagsLoading ? (
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
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
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
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
                    ) : filteredTags.length === 0 ? (
                      <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {filteredTags.map((tag: any) => (
                          <CommandItem
                            key={tag.id}
                            value={`${tag.name} ${tag.slug ?? ""} ${tag.id}`}
                            keywords={[tag.slug, String(tag.id)].filter(Boolean)}
                            onSelect={() =>
                              onChange({
                                tagIds: selectedTagIds.includes(tag.id)
                                  ? selectedTagIds.filter((id) => id !== tag.id)
                                  : [...selectedTagIds, tag.id],
                              })
                            }
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
          {selectedTagIds.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {selectedTagIds.map((tagId) => {
                const tag =
                  (allTags || []).find((t: any) => t.id === tagId) ||
                  filteredTags.find((t: any) => t.id === tagId);
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
                        onChange({
                          tagIds: selectedTagIds.filter((id) => id !== tagId),
                        });
                      }}
                      className="ml-1 rounded-sm hover:bg-secondary-foreground/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </Field>
      </Section>

      <Section title="Regras">
        <Field
          label="Nota de aprovação"
          htmlFor="passingScore"
          hint={
            pointsToPass !== null
              ? `${formData.passingScore}% de ${totalPoints} ${totalPoints === 1 ? "ponto" : "pontos"} — o aluno precisa acertar ${pointsToPass}.`
              : "Adicione perguntas para ver quantos pontos isso exige."
          }
        >
          <NumberInput
            id="passingScore"
            value={formData.passingScore}
            onValueChange={(value) => onChange({ passingScore: value || 0 })}
            min={0}
            max={100}
            stepper={5}
            suffix="%"
            placeholder="70"
          />
        </Field>

        <Field
          label="Tempo limite"
          htmlFor="timeLimit"
          hint="Verificado no envio: passar do tempo invalida a tentativa. O app ainda não mostra contagem regressiva ao aluno. Deixe em 0 para sem limite."
        >
          <NumberInput
            id="timeLimit"
            value={formData.timeLimit}
            onValueChange={(value) => onChange({ timeLimit: value })}
            min={0}
            max={600}
            stepper={5}
            suffix=" min"
            placeholder="0"
          />
        </Field>
      </Section>

      <Section
        title="Retorno ao aluno"
        description="O aluno responde uma questão por vez e sempre vê a pontuação final."
      >
        <ToggleRow
          id="showResults"
          label="Corrigir a cada questão"
          description="O aluno vê se acertou logo após responder, antes de seguir."
          checked={formData.showResults}
          onCheckedChange={(checked) => onChange({ showResults: checked })}
        />

        <div className="border-l-2 border-border pl-4">
          <ToggleRow
            id="showCorrectAnswers"
            label="Revelar a resposta certa"
            description={
              formData.showResults
                ? "Inclui a resposta correta e a explicação da questão nesse retorno."
                : "Requer a correção a cada questão."
            }
            checked={formData.showCorrectAnswers}
            disabled={!formData.showResults}
            onCheckedChange={(checked) =>
              onChange({ showCorrectAnswers: checked })
            }
          />
        </div>
      </Section>
    </div>
  );
}
