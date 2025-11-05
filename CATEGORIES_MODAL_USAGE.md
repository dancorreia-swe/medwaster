# Categories Modal Form - Usage Guide

I've successfully created a complete categories modal form following the same patterns as the tags implementation. Here's how to use it:

## What's Been Created

1. **CategoryFormDialog** - A reusable modal component for creating/editing categories
2. **CategoriesPage** - A complete page component that integrates the modal with a table
3. **Updated CategoriesTable** - Now supports edit and delete actions
4. **Integration** - Properly connected to existing API hooks and backend

## Files Created/Modified

```
apps/web/src/features/categories/components/
├── category-form-dialog.tsx       # NEW - Main modal form component
├── categories-page.tsx            # NEW - Complete page with modal integration
├── index.ts                       # UPDATED - Exports new components
└── table/
    ├── categories-table.tsx       # UPDATED - Added onEdit/onDelete props
    └── category-row.tsx           # UPDATED - Connected to external handlers
```

## How to Use

### Option 1: Complete Page Component

```tsx
import { useState } from 'react';
import { CategoriesPage } from '@/features/categories/components';

export function AdminCategoriesRoute() {
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    // Add debouncing logic here if needed
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Handle search submit
  };

  return (
    <CategoriesPage
      searchValue={searchValue}
      isSearching={isSearching}
      onSearchChange={handleSearchChange}
      onSearchSubmit={handleSearchSubmit}
    />
  );
}
```

### Option 2: Just the Modal Component

```tsx
import { useState } from 'react';
import { CategoryFormDialog, type CategoryFormValues } from '@/features/categories/components';
import { useCreateCategory, useUpdateCategory } from '@/features/categories/hooks';

export function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const handleSubmit = async (values: CategoryFormValues) => {
    if (categoryToEdit) {
      await updateMutation.mutateAsync({ id: categoryToEdit.id, ...values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setIsModalOpen(false);
    setCategoryToEdit(null);
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Create Category
      </button>
      
      <CategoryFormDialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        category={categoryToEdit}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
```

## Features Included

### Form Fields
- **Name** (required, max 100 chars) - Auto-generates slug
- **Slug** (required, auto-generated, regex validated)  
- **Description** (optional, max 500 chars)
- **Color** (required, hex color with visual picker)

### Form Behavior
- Auto-slug generation from name (only when creating)
- Color picker with preview and eyedropper
- Form validation with Zod schema
- Loading states and disabled controls
- Success/error toast notifications
- Automatic query invalidation after mutations

### Integration
- Uses existing `useCreateCategory` and `useUpdateCategory` hooks
- Follows same patterns as tags implementation
- Properly typed with TypeScript
- Consistent UI/UX with shadcn/ui components

## Backend Schema Support

The form perfectly matches the backend schema:

```typescript
// Backend categories schema
{
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}
```

## Ready to Use

The categories modal is now ready for use! You can:

1. Import and use the `CategoriesPage` component for a complete admin interface
2. Use just the `CategoryFormDialog` component in custom implementations  
3. Integrate with existing routing and navigation
4. Customize the styling and behavior as needed

The implementation follows all the established patterns in the codebase and should work seamlessly with the existing categories API and hooks.