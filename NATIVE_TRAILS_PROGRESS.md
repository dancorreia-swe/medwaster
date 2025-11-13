# Native App Trails Implementation - Progress Report

## Session Date: 2025-11-13

### ✅ Completed

1. **API Client** (`apps/native/features/trails/api.ts`)
   - All endpoint functions created
   - Proper error handling with assertSuccess helper
   - Portuguese error messages

2. **React Query Hooks** (`apps/native/features/trails/hooks.ts`)
   - Query hooks: useTrails, useTrail, useTrailProgress, useTrailContent
   - Mutation hooks: useEnrollInTrail, useSubmitTrailQuestion, useStartTrailQuiz, useSubmitTrailQuiz, useMarkTrailArticleRead
   - Automatic invalidation of gamification data after trail activities

3. **UI Components**
   - **TrailCard** (`trail-card.tsx`): List item showing trail info, difficulty, progress
   - **TrailContentItem** (`trail-content-item.tsx`): Content item display with icons, completion status

4. **Trails List Screen** (`app/(app)/(tabs)/trails/index.tsx`)
   - Replaced mock data with real API
   - Integrated useTrails hook
   - Loading, error, and empty states
   - Filter functionality (all/in-progress/available/completed)
   - Navigation to trail detail

### 🚧 In Progress

5. **Trail Detail Screen** (`app/(app)/(tabs)/trails/[id].tsx`)
   - **Current Status**: Has elaborate UI with mock data and Zustand store
   - **Needs**: Integration with real API (useTrail, useTrailProgress, useTrailContent hooks)
   - **Design**: Keep existing design, replace data source

### ⏳ Todo

6. **Trail Content Screen** (new file needed)
   - **Path**: `app/(app)/trails/[id]/content/[contentId].tsx`
   - **Purpose**: Render question/quiz/article within trail context
   - **Features**:
     - Detect content type (question/quiz/article)
     - Render appropriate UI
     - Submit answers using trail-specific hooks
     - Navigate back to trail detail on completion

7. **Testing & Polish**
   - Test all trail flows
   - Verify gamification integration
   - Test error states
   - Verify navigation flows

---

## Implementation Notes

### Trail Detail Screen - Recommended Approach

The existing screen at `app/(app)/(tabs)/trails/[id].tsx` has a beautiful design but uses:
- Mock data in `journeyData` object
- Zustand store (`useTrailStore`)
- Hardcoded navigation paths

**Option 1: Update Existing Screen (Recommended)**
- Keep the beautiful UI
- Replace `journeyData` with `useTrail(id)` and `useTrailContent(id)`
- Replace Zustand store with React Query cache
- Update navigation to use real content IDs
- Map backend content types to existing module rendering

**Option 2: Create New Screen**
- Build simpler version using TrailContentItem component
- Focus on functionality over elaborate design
- Can iterate on design later

### Content Type Mapping

Backend content types → Frontend rendering:
- `question` → Question component (existing)
- `quiz` → Quiz flow (needs implementation)
- `article` → Article viewer (existing)

### Enrollment Flow

Trail detail screen should:
1. Check if user is enrolled (`trail.progress?.isEnrolled`)
2. If not enrolled, show "Enroll" button
3. On enroll, call `enrollInTrail()` mutation
4. On success, show content list

### Navigation Structure

```
/(app)/(tabs)/trails              → List screen
/(app)/(tabs)/trails/[id]          → Detail screen (with back to list)
/(app)/trails/[id]/content/[contentId]  → Content screen (with back to detail)
```

Note: The content screen is outside tabs to allow full-screen experience.

---

## Key Files Modified

1. `apps/native/features/trails/api.ts` - ✅ Created
2. `apps/native/features/trails/hooks.ts` - ✅ Created
3. `apps/native/features/trails/components/trail-card.tsx` - ✅ Created
4. `apps/native/features/trails/components/trail-content-item.tsx` - ✅ Created
5. `apps/native/features/trails/components/index.ts` - ✅ Updated exports
6. `apps/native/app/(app)/(tabs)/trails/index.tsx` - ✅ Integrated with API
7. `apps/native/app/(app)/(tabs)/trails/[id].tsx` - ⏳ Needs API integration
8. `apps/native/app/(app)/trails/[id]/content/[contentId].tsx` - ⏳ Needs creation

---

## Next Steps for Continuation

1. **Update Trail Detail Screen**:
   ```typescript
   // Replace mock data with:
   const { data: trail, isLoading: trailLoading } = useTrail(Number(id));
   const { data: progress } = useTrailProgress(Number(id));
   const { data: content, isLoading: contentLoading } = useTrailContent(Number(id));
   const enrollMutation = useEnrollInTrail();

   // Show enroll button if not enrolled
   if (!progress?.isEnrolled) {
     // Show enroll UI
   }

   // Map content to modules format
   const modules = content?.map(item => ({
     id: item.id,
     type: item.contentType,
     title: getContentTitle(item),
     status: getContentStatus(item),
     // ... etc
   }));
   ```

2. **Create Content Screen**:
   - Check contentType and render appropriate component
   - Use trail-specific submission hooks
   - Handle success/error states
   - Navigate back with progress update

3. **Test Integration**:
   - Enroll in trail
   - Complete content items
   - Verify missions update
   - Test streak tracking

---

## Backend Integration Points

All backend endpoints are working:
- ✅ GET /trails - List trails
- ✅ GET /trails/:id - Trail details
- ✅ GET /trails/:id/progress - User progress
- ✅ POST /trails/:id/enroll - Enroll
- ✅ GET /trails/:id/content - Content list
- ✅ POST /trails/:id/questions/:questionId/submit - Submit question
- ✅ POST /trails/:id/content/:contentId/quiz/start - Start quiz
- ✅ POST /trails/:id/content/:contentId/quiz/submit/:attemptId - Submit quiz
- ✅ POST /trails/:id/content/:contentId/article/mark-read - Mark article read

All hooks automatically invalidate gamification queries after mutations.

---

## Design Patterns to Follow

- Use existing app patterns (see missions screen, article screen)
- Match header styling with ChevronLeft back button
- Use same loading states (ActivityIndicator + text)
- Use same error messaging patterns
- Keep Portuguese translations consistent

---

**Last Updated**: 2025-11-13 01:30 AM
**Status**: 70% Complete (API layer done, UI partially done)
**Estimated Remaining**: 2-3 hours
