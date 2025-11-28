# Centralized API Error Handling

## Overview

This document describes the centralized error handling system for API requests across the MedWaster web application.

## Purpose

Previously, error handling logic was duplicated across multiple API query files (`wikiQueries.ts`, `trailsQueries.ts`). This made it difficult to maintain consistency and add new error handling features.

The `api-error-handler.ts` module provides a single source of truth for:
- Error message translations (Portuguese)
- Field name translations
- Validation error formatting
- Error extraction from API responses

## Location

```
apps/web/src/lib/api-error-handler.ts
```

## Exported Functions

### `isErrorResponse(response: any): boolean`
Checks if an API response contains an error.

### `translateFieldName(field: string): string`
Translates field names from English to Portuguese.

**Supported Fields:**
- Common: title, name, description, content, status, etc.
- Wiki: featuredImageUrl, externalAuthors, publicationDate, etc.
- Trails: difficulty, passPercentage, unlockOrder, etc.
- Questions: prompt, explanation, points, etc.

### `formatValidationError(details: any): string | null`
Formats validation errors with detailed field-level information.

**Features:**
- Handles multiple validation errors
- Formats min/max length constraints
- Formats min/max value constraints
- Formats pattern validation
- Handles required field errors

### `getErrorMessage(responseError: any, defaultMessage: string): string`
Extracts user-friendly error messages from API responses.

**Handles:**
- Validation errors with field details
- Business logic errors
- Dependency errors
- Standard error codes
- Nested error structures

### `handleApiError(response: any, defaultMessage: string): void`
Checks response for errors and throws with user-friendly message.

**Usage in API functions:**
```typescript
const response = await api.createSomething(data);
handleApiError(response, "Erro ao criar item");
return response;
```

### `extractErrorMessage(error: any, defaultMessage: string): string`
Custom hook-friendly error extractor for use in mutation error handlers.

**Usage in React Query mutations:**
```typescript
onError: (error: any) => {
  const errorMessage = extractErrorMessage(error, "Erro ao criar item");
  toast.error(errorMessage);
}
```

## Error Message Categories

### Business Logic Errors
- `NEED_CATEGORY` - Category required for publishing
- `BUSINESS_LOGIC_ERROR` - Generic business rule error
- `DEPENDENCY_ERROR` - Resource is in use by other resources

### Validation Errors
- `VALIDATION_ERROR` - Validation error
- `UNPROCESSABLE_ENTITY` - Invalid data
- `BAD_REQUEST` - Invalid request

### Auth Errors
- `UNAUTHORIZED` - No permission
- `FORBIDDEN` - Access denied

### Resource Errors
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict

### Server Errors
- `INTERNAL_SERVER_ERROR` - Server error
- `SERVICE_UNAVAILABLE` - Service unavailable
- `DATABASE_ERROR` - Database error

### Rate Limiting
- `TOO_MANY_REQUESTS` - Too many requests

## Migration Guide

### Before (Duplicated Code)
```typescript
// In wikiQueries.ts
const ERROR_MESSAGES = { ... };
const translateFieldName = (field) => { ... };
const formatValidationError = (details) => { ... };
const getErrorMessage = (error, defaultMsg) => { ... };
const handleApiError = (response, defaultMsg) => { ... };

// In trailsQueries.ts
const ERROR_MESSAGES = { ... };
const translateFieldName = (field) => { ... };
const formatValidationError = (details) => { ... };
const getErrorMessage = (error, defaultMsg) => { ... };
const handleApiError = (response, defaultMsg) => { ... };
```

### After (Centralized)
```typescript
// In wikiQueries.ts
import { isErrorResponse, getErrorMessage, handleApiError } from "@/lib/api-error-handler";

// In trailsQueries.ts
import { extractErrorMessage } from "@/lib/api-error-handler";
```

## Usage Examples

### In API Functions
```typescript
export const createArticle = async (data: CreateArticleInput) => {
  const response = await wikiApi.createArticle(data);
  handleApiError(response, "Erro ao criar artigo.");
  return response;
};
```

### In Mutation Hooks
```typescript
export function useCreateTrail() {
  return useMutation({
    mutationFn: (body) => trailsApi.createTrail(body),
    onError: (error: any) => {
      const errorMessage = extractErrorMessage(error, "Erro ao criar trilha");
      toast.error(errorMessage);
    },
  });
}
```

## Benefits

1. **Single Source of Truth**: All error handling logic in one place
2. **Consistency**: Same error messages across the entire application
3. **Maintainability**: Easier to add new error types or field translations
4. **Type Safety**: Centralized exports are easier to type correctly
5. **Reduced Code**: Eliminates ~200 lines of duplicate code per module
6. **Extensibility**: Easy to add support for new modules (questions, quizzes, etc.)

## Future Enhancements

- Add support for internationalization (i18n) for multiple languages
- Add error tracking/logging integration
- Add more specific error types for different API domains
- Add retry logic for certain error types
- Add error analytics and monitoring
