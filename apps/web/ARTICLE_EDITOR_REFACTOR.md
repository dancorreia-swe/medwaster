# Article Editor Refactoring

## Summary

Successfully refactored the overcrowded article editor route into smaller, reusable components organized in the features directory.

## Changes Made

### New Directory Structure

```
apps/web/src/features/wiki/
├── components/
│   ├── article-editor-toolbar.tsx    - Toolbar with save/publish buttons and status
│   ├── article-title-input.tsx       - Title input field component
│   ├── article-category-select.tsx   - Category dropdown selector
│   ├── article-tags-input.tsx        - Tags input with creation
│   ├── article-metadata.tsx          - Combined metadata (category, tags, author)
│   ├── article-content-editor.tsx    - BlockNote editor wrapper
│   └── index.ts                      - Component exports
├── hooks/
│   └── use-article-editor.ts         - Custom hook for editor state & logic
└── api/ (existing)
    └── wikiQueries.ts
```

### Component Breakdown

#### 1. **ArticleEditorToolbar** (`article-editor-toolbar.tsx`)
- Status badge (Draft/Published)
- Auto-save indicator with timestamp
- Save and Publish buttons with loading states

#### 2. **ArticleTitleInput** (`article-title-input.tsx`)
- Simple controlled input for article title
- Styled as large heading placeholder

#### 3. **ArticleCategorySelect** (`article-category-select.tsx`)
- Category dropdown selector
- Loading state handling
- Folder icon with label

#### 4. **ArticleTagsInput** (`article-tags-input.tsx`)
- Tag selection and creation
- Tag list with search/filter
- Create new tags inline
- Remove tags functionality

#### 5. **ArticleMetadata** (`article-metadata.tsx`)
- Combines category select, tags input, and author display
- Responsive layout for mobile/desktop

#### 6. **ArticleContentEditor** (`article-content-editor.tsx`)
- BlockNote editor wrapper
- Theme integration
- File upload handling
- Editor initialization callback

#### 7. **useArticleEditor Hook** (`use-article-editor.ts`)
- Centralized state management
- Auto-save logic with debouncing
- Save/publish handlers
- Tag management
- Editor initialization
- Form validation

### Refactored Route File

**Before:** 459 lines of mixed concerns  
**After:** 155 lines focused on routing and composition

The route file now:
- Handles routing and loading states
- Composes components cleanly
- Delegates logic to custom hook
- Much more maintainable

## Benefits

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components can be used in other article-related features
3. **Testability**: Smaller units are easier to test
4. **Maintainability**: Changes to one feature don't affect others
5. **Readability**: Clear component hierarchy and data flow
6. **Type Safety**: Proper TypeScript interfaces for all props
7. **Performance**: Can optimize individual components separately

## Next Steps

Now that the components are broken down, you can:

1. **Add proper TypeScript types** - Replace `any` with proper interfaces
2. **Fix functionality issues** - Easier to debug individual components
3. **Add error handling** - Component-level error boundaries
4. **Add loading states** - Per-component skeleton loaders
5. **Write tests** - Unit tests for components and hook
6. **Add validation** - Form-level validation with proper feedback
7. **Optimize performance** - Memo components where needed

## File Locations

- Components: `/apps/web/src/features/wiki/components/`
- Hook: `/apps/web/src/features/wiki/hooks/use-article-editor.ts`
- Route: `/apps/web/src/routes/_auth/wiki/$articleId/index.tsx`
- Backup: `/apps/web/src/routes/_auth/wiki/$articleId/index.tsx.bak`
