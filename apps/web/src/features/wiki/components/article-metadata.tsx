import { User } from "lucide-react";
import { ArticleCategorySelect } from "./article-category-select";
import { ArticleTagsInput } from "./article-tags-input";

interface Category {
  id: number;
  name: string;
}

interface ArticleMetadataProps {
  categoryId: number | undefined;
  onCategoryChange: (categoryId: number | undefined) => void;
  categories: Category[];
  categoriesLoading: boolean;
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  authorName: string;
}

export function ArticleMetadata({
  categoryId,
  onCategoryChange,
  categories,
  categoriesLoading,
  selectedTags,
  onTagsChange,
  authorName,
}: ArticleMetadataProps) {
  return (
    <div className="mt-6 space-y-4">
      <div className="flex max-w-lg flex-col gap-x-4 gap-y-3 md:flex-row md:items-center md:gap-x-8">
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
        onTagsChange={onTagsChange}
      />
    </div>
  );
}
