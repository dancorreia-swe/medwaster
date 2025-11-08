import { useState, useEffect } from "react";
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ArticleTagsInput({ selectedTags, onTagsChange }: ArticleTagsInputProps) {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: searchTagsData, isLoading: isSearching } = useSearchTags(debouncedSearch);
  const { data: allTagsData } = useSearchTags("");
  const createTagMutation = useCreateTag();

  const searchedTags = searchTagsData?.data || [];
  const allTags = allTagsData?.data || [];

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
      toast.error("Erro ao criar tag. Tente novamente.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchValue.trim()) {
      e.preventDefault();
      handleCreateTag();
    }
  };

  const filteredTags = searchedTags;

  const selectedTagsData = allTags.filter((tag: any) => selectedTags.includes(tag.id));

  return (
    <div className="flex items-center gap-2">
      <Tag size={16} className="text-muted-foreground" />
      <Tags className="max-w-lg">
        <TagsTrigger className="h-8 border-0 px-1 font-normal shadow-none focus:ring-0 focus:ring-offset-0">
          {selectedTagsData.map((tag: any) => (
            <TagsValue key={tag.id} onRemove={() => handleTagRemove(tag.id)}>
              {tag.name}
            </TagsValue>
          ))}
        </TagsTrigger>
        <TagsContent>
          <TagsInput
            placeholder="Pesquise ou crie uma tag..."
            value={searchValue}
            onValueChange={setSearchValue}
            onKeyDown={handleKeyDown}
          />
          <TagsList>
            {isSearching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTags.length === 0 && searchValue ? (
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
                {filteredTags.map((tag: any) => (
                  <TagsItem key={tag.id} onSelect={handleTagSelect} value={tag.id.toString()}>
                    <span className="flex-1">{tag.name}</span>
                    {selectedTags.includes(tag.id) && (
                      <CheckIcon className="text-muted-foreground ml-auto" size={14} />
                    )}
                  </TagsItem>
                ))}
              </TagsGroup>
            )}
          </TagsList>
        </TagsContent>
      </Tags>
    </div>
  );
}
