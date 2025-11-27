import { useState, useEffect, useMemo } from "react";
import {
  Tags,
  TagsContent,
  TagsEmpty,
  TagsGroup,
  TagsInput,
  TagsItem,
  TagsList,
  TagsTrigger,
  TagsValue,
} from "@/components/ui/shadcn-io/tags";
import { CheckIcon, PlusIcon, Tag, Loader2 } from "lucide-react";
import { useSearchTags, useCreateTag } from "../api/wikiQueries";
import { useDebouncedCallback } from "@/hooks/use-debounce";
import { toast } from "sonner";

interface ArticleTagsInputProps {
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
}

function normalizeTags(raw: unknown): any[] {
  if (Array.isArray(raw)) {
    return raw;
  }

  if (raw && typeof raw === "object" && "data" in raw) {
    const maybeData = (raw as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return maybeData;
    }
  }

  return [];
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DEFAULT_COLOR = "#94a3b8";

// Helper function to determine if a color is light or dark
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light colors, white for dark colors
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export function ArticleTagsInput({ selectedTags, onTagsChange }: ArticleTagsInputProps) {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Fetch filtered tags for dropdown based on search
  const { data: searchTagsData, isLoading: isSearching } = useSearchTags(debouncedSearch);
  // Fetch all tags separately to always display selected tags correctly
  const { data: allTagsData } = useSearchTags("");
  const createTagMutation = useCreateTag();

  const searchResultTags = normalizeTags(searchTagsData);
  const allTags = normalizeTags(allTagsData);

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 300);

  useEffect(() => {
    debouncedSetSearch(searchValue);
  }, [searchValue, debouncedSetSearch]);

  const handleTagSelect = (tagId: string) => {
    const numericId = Number(tagId);
    if (selectedTags.includes(numericId)) {
      onTagsChange(selectedTags.filter((id) => id !== numericId));
    } else {
      onTagsChange([...selectedTags, numericId]);
    }
  };

  const handleTagRemove = (tagId: number) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId));
  };

  const handleCreateTag = async () => {
    if (!searchValue.trim()) return;

    const slug = slugify(searchValue);

    try {
      const response = await createTagMutation.mutateAsync({
        name: searchValue.trim(),
        slug,
      });

      if (response?.data?.id) {
        onTagsChange([...selectedTags, response.data.id]);
        toast.success(`Tag "${searchValue}" criada com sucesso!`);
      }

      setSearchValue("");
      setDebouncedSearch("");
    } catch (error) {
      console.error("Error creating tag:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Erro ao criar tag. Tente novamente.";
      toast.error(errorMessage);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchValue.trim()) {
      e.preventDefault();
      handleCreateTag();
    }
  };

  // Memoize selected tags to avoid recalculation on every render
  const selectedTagsData = useMemo(() => {
    return allTags.filter((tag: any) => selectedTags.includes(tag.id));
  }, [allTags, selectedTags]);

  return (
    <div className="flex items-center gap-2">
      <Tag size={16} className="text-muted-foreground" />
      <Tags className="max-w-lg">
        <TagsTrigger className="h-8 border-0 px-1 font-normal shadow-none focus:ring-0 focus:ring-offset-0">
          {selectedTagsData.map((tag: any) => {
            const color = tag.color || DEFAULT_COLOR;
            const textColor = getContrastColor(color);
            return (
              <TagsValue
                key={tag.id}
                onRemove={() => handleTagRemove(tag.id)}
                className="border-transparent [&>div]:hover:opacity-70"
                style={{
                  backgroundColor: color,
                  color: textColor,
                }}
              >
                {tag.name}
              </TagsValue>
            );
          })}
        </TagsTrigger>
        <TagsContent>
          <TagsInput
            placeholder="Pesquise ou crie uma tag..."
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
          />
          <TagsList>
            {isSearching && debouncedSearch !== searchValue ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : searchResultTags.length === 0 && searchValue ? (
              <TagsEmpty>
                <button
                  className="mx-auto flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  onClick={handleCreateTag}
                  type="button"
                  disabled={createTagMutation.isPending}
                >
                  {createTagMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <PlusIcon className="text-muted-foreground" size={14} />
                  )}
                  Criar tag: <strong>{searchValue}</strong> (Enter)
                </button>
              </TagsEmpty>
            ) : (
              <TagsGroup>
                {searchResultTags.map((tag: any) => {
                  const color = tag.color || DEFAULT_COLOR;
                  return (
                    <TagsItem
                      key={tag.id}
                      // Use the tag's text for Command's internal filtering and
                      // explicitly pass the numeric id to the select handler.
                      value={`${tag.name}${tag.slug ? ` ${tag.slug}` : ""}`}
                      keywords={[tag.slug, String(tag.id)].filter(Boolean)}
                      onSelect={() => handleTagSelect(tag.id.toString())}
                    >
                      <span className="flex items-center gap-2 flex-1">
                        <span
                          aria-hidden
                          className="inline-flex h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: color }}
                        />
                        {tag.name}
                      </span>
                      {selectedTags.includes(tag.id) && (
                        <CheckIcon className="text-muted-foreground ml-auto" size={14} />
                      )}
                    </TagsItem>
                  );
                })}
              </TagsGroup>
            )}
          </TagsList>
        </TagsContent>
      </Tags>
    </div>
  );
}
