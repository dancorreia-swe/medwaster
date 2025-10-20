import { User } from "lucide-react";
import { ArticleCategorySelect } from "./article-category-select";
import { ArticleTagsInput, type TagOption } from "./article-tags-input";

interface Category {
  id: number;
  name: string;
}

interface ArticleMetadataProps {
  categoryId: number | undefined;
  onCategoryChange: (categoryId: number | undefined) => void;
  categories: Category[];
  categoriesLoading: boolean;
  selectedTags: string[];
  availableTags: TagOption[];
  newTag: string;
  onTagSelect: (tagId: string) => void;
  onTagRemove: (tagId: string) => void;
  onNewTagChange: (value: string) => void;
  onCreateTag: () => void;
  authorName: string;
}

export function ArticleMetadata({
  categoryId,
  onCategoryChange,
  categories,
  categoriesLoading,
  selectedTags,
  availableTags,
  newTag,
  onTagSelect,
  onTagRemove,
  onNewTagChange,
  onCreateTag,
  authorName,
}: ArticleMetadataProps) {
  return (
    <>
      <div className="mt-4 flex max-w-lg flex-col gap-x-4 gap-y-3 md:flex-row md:items-center md:gap-x-8">
        <ArticleCategorySelect
          value={categoryId}
          onChange={onCategoryChange}
          categories={categories}
          isLoading={categoriesLoading}
        />

        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <User size={16} className="text-muted-foreground" />
          {authorName}
        </span>
      </div>

      <ArticleTagsInput
        selectedTags={selectedTags}
        availableTags={availableTags}
        newTag={newTag}
        onTagSelect={onTagSelect}
        onTagRemove={onTagRemove}
        onNewTagChange={onNewTagChange}
        onCreateTag={onCreateTag}
      />
    </>
  );
}
