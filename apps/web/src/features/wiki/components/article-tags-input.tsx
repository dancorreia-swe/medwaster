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
import { CheckIcon, PlusIcon, Tag } from "lucide-react";

export interface TagOption {
  id: string;
  label: string;
}

interface ArticleTagsInputProps {
  selectedTags: string[];
  availableTags: TagOption[];
  newTag: string;
  onTagSelect: (tagId: string) => void;
  onTagRemove: (tagId: string) => void;
  onNewTagChange: (value: string) => void;
  onCreateTag: () => void;
}

export function ArticleTagsInput({
  selectedTags,
  availableTags,
  newTag,
  onTagSelect,
  onTagRemove,
  onNewTagChange,
  onCreateTag,
}: ArticleTagsInputProps) {
  return (
    <div className="flex items-center gap-2">
      <Tag size={16} className="text-muted-foreground" />
      <Tags className="max-w-lg">
        <TagsTrigger className="h-8 border-0 px-1 font-normal shadow-none focus:ring-0 focus:ring-offset-0">
          {selectedTags.map((tag) => (
            <TagsValue key={tag} onRemove={() => onTagRemove(tag)}>
              {availableTags.find((t) => t.id === tag)?.label ?? tag}
            </TagsValue>
          ))}
        </TagsTrigger>
        <TagsContent>
          <TagsInput
            placeholder="Pesquise uma tag..."
            onValueChange={onNewTagChange}
          />
          <TagsList>
            <TagsEmpty>
              <button
                className="mx-auto flex cursor-pointer items-center gap-2"
                onClick={onCreateTag}
                type="button"
              >
                <PlusIcon className="text-muted-foreground" size={14} />
                Criar nova tag: {newTag}
              </button>
            </TagsEmpty>
            <TagsGroup>
              {availableTags.map((tag) => (
                <TagsItem
                  key={tag.id}
                  onSelect={onTagSelect}
                  value={tag.id}
                >
                  {tag.label}
                  {selectedTags.includes(tag.id) && (
                    <CheckIcon
                      className="text-muted-foreground"
                      size={14}
                    />
                  )}
                </TagsItem>
              ))}
            </TagsGroup>
          </TagsList>
        </TagsContent>
      </Tags>
    </div>
  );
}
