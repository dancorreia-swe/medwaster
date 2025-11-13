# Trails Native App Implementation Plan

## Session Summary

### ✅ Backend Implementation Complete (2025-11-12)

All backend work for trails integration with gamification is complete and tested. The server compiles and runs successfully.

#### Phase 1: Question Type Support ✅
- **File**: `apps/server/src/modules/trails/progress.service.ts`
- Added support for `fill_in_the_blank` and `matching` question types
- Grading logic ported from QuizzesService
- All 4 question types now supported in trails: multiple_choice, true_false, fill_in_the_blank, matching

#### Phase 2: Quiz-in-Trail Endpoints ✅
- **Files**: `progress.service.ts`, `index.ts`
- New service methods:
  - `startQuizInTrail()` - Lines 535-586
  - `submitQuizInTrail()` - Lines 591-688
- New API endpoints:
  - `POST /trails/:id/content/:contentId/quiz/start`
  - `POST /trails/:id/content/:contentId/quiz/submit/:attemptId`
- Features: Auto-marks content complete if passing score reached

#### Phase 3: Article-in-Trail Endpoint ✅
- **Files**: `progress.service.ts`, `index.ts`
- New service method: `markArticleReadInTrail()` - Lines 693-760
- New API endpoint: `POST /trails/:id/content/:contentId/article/mark-read`
- Articles are binary (read/not read) - auto-complete on mark read

#### Phase 4: Gamification Integration ✅
- **File**: `progress.service.ts`
- Integrated `DailyActivitiesService.recordActivity()` throughout trail completions
- All trail activities now:
  - Update user streaks
  - Progress relevant missions (both trail-specific and content-specific)
  - Track daily activity stats
- Integration points:
  - Question submissions: Lines 521-538
  - Quiz submissions: Lines 702-721
  - Article reading: Lines 797-812

#### Phase 5: Trail Score Calculation ✅
- **File**: `progress.service.ts`, `checkAndCompleteTrail()` method (Lines 851-940)
- Replaced placeholder `score = 100` with weighted calculation
- Aggregates scores from all completed required content
- Formula: `sum(contentScore * contentPoints) / sum(contentPoints) * 100`
- Respects `trailContent.points` for weighting

---

## 🎯 Next Steps: Native App Implementation

### Overview
Now that the backend is complete, implement the native app to consume these trails endpoints and integrate with the gamification system.

---

## 1. Create Trails API Client & Hooks

### Files to Create

#### `apps/native/features/trails/api.ts`
```typescript
import { client } from "@/lib/eden";
import type { SuccessResponse } from "@server/lib/responses";

// Types (import from server)
import type {
  Trail,
  TrailContent,
  UserTrailProgress,
  UserContentProgress,
} from "@server/db/schema/trails";

// API functions to implement:

// List available trails
export async function fetchTrails(params?: {
  difficulty?: string;
  categoryId?: number;
  status?: string;
}) {
  const response = await client.trails.index.get({ query: params });
  return assertSuccess(response, "Failed to load trails");
}

// Get single trail with content
export async function fetchTrailById(id: number) {
  const response = await client.trails({ id }).get();
  return assertSuccess(response, "Failed to load trail");
}

// Get user's progress in trail
export async function fetchTrailProgress(id: number) {
  const response = await client.trails({ id }).progress.get();
  return assertSuccess(response, "Failed to load progress");
}

// Enroll in trail
export async function enrollInTrail(id: number) {
  const response = await client.trails({ id }).enroll.post();
  return assertSuccess(response, "Failed to enroll");
}

// Get trail content list
export async function fetchTrailContent(id: number) {
  const response = await client.trails({ id }).content.get();
  return assertSuccess(response, "Failed to load content");
}

// Submit question answer in trail
export async function submitTrailQuestion(
  trailId: number,
  questionId: number,
  data: {
    answer: number | number[] | string | Record<string, string>;
    timeSpentSeconds?: number;
  }
) {
  const response = await client.trails({ id: trailId })
    .questions({ questionId })
    .submit.post(data);
  return assertSuccess(response, "Failed to submit answer");
}

// Start quiz in trail
export async function startTrailQuiz(
  trailId: number,
  contentId: number,
  data: { ipAddress?: string; userAgent?: string }
) {
  const response = await client.trails({ id: trailId })
    .content({ contentId })
    .quiz.start.post(data);
  return assertSuccess(response, "Failed to start quiz");
}

// Submit quiz in trail
export async function submitTrailQuiz(
  trailId: number,
  contentId: number,
  attemptId: number,
  data: {
    answers: Array<{
      quizQuestionId: number;
      selectedOptions?: number[];
      textAnswer?: string;
      matchingAnswers?: Record<string, string>;
      timeSpent?: number;
    }>;
    timeSpent?: number;
  }
) {
  const response = await client.trails({ id: trailId })
    .content({ contentId })
    .quiz.submit({ attemptId })
    .post(data);
  return assertSuccess(response, "Failed to submit quiz");
}

// Mark article as read in trail
export async function markTrailArticleRead(
  trailId: number,
  contentId: number
) {
  const response = await client.trails({ id: trailId })
    .content({ contentId })
    .article["mark-read"].post();
  return assertSuccess(response, "Failed to mark article");
}
```

#### `apps/native/features/trails/hooks.ts`
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchTrails,
  fetchTrailById,
  fetchTrailProgress,
  enrollInTrail,
  fetchTrailContent,
  submitTrailQuestion,
  startTrailQuiz,
  submitTrailQuiz,
  markTrailArticleRead,
} from "./api";
import { gamificationKeys } from "../gamification/hooks";

// Query keys
export const trailKeys = {
  all: ["trails"] as const,
  lists: () => [...trailKeys.all, "list"] as const,
  list: (filters: string) => [...trailKeys.lists(), { filters }] as const,
  details: () => [...trailKeys.all, "detail"] as const,
  detail: (id: number) => [...trailKeys.details(), id] as const,
  progress: (id: number) => [...trailKeys.all, "progress", id] as const,
  content: (id: number) => [...trailKeys.all, "content", id] as const,
};

// Hooks to implement:
export function useTrails(filters?: any) {
  return useQuery({
    queryKey: trailKeys.list(JSON.stringify(filters || {})),
    queryFn: () => fetchTrails(filters),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrail(id: number) {
  return useQuery({
    queryKey: trailKeys.detail(id),
    queryFn: () => fetchTrailById(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTrailProgress(id: number) {
  return useQuery({
    queryKey: trailKeys.progress(id),
    queryFn: () => fetchTrailProgress(id),
    staleTime: 2 * 60 * 1000,
  });
}

export function useTrailContent(id: number) {
  return useQuery({
    queryKey: trailKeys.content(id),
    queryFn: () => fetchTrailContent(id),
    staleTime: 5 * 60 * 1000,
  });
}

export function useEnrollInTrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enrollInTrail,
    onSuccess: (_, trailId) => {
      queryClient.invalidateQueries({ queryKey: trailKeys.progress(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.detail(trailId) });
    },
  });
}

export function useSubmitTrailQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, questionId, data }: any) =>
      submitTrailQuestion(trailId, questionId, data),
    onSuccess: (_, { trailId }) => {
      // Invalidate trail progress
      queryClient.invalidateQueries({ queryKey: trailKeys.progress(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.content(trailId) });

      // Invalidate gamification data
      queryClient.invalidateQueries({ queryKey: gamificationKeys.missions() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streak() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.todayActivity() });
    },
  });
}

export function useStartTrailQuiz() {
  return useMutation({
    mutationFn: ({ trailId, contentId, data }: any) =>
      startTrailQuiz(trailId, contentId, data),
  });
}

export function useSubmitTrailQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, contentId, attemptId, data }: any) =>
      submitTrailQuiz(trailId, contentId, attemptId, data),
    onSuccess: (_, { trailId }) => {
      // Invalidate trail progress
      queryClient.invalidateQueries({ queryKey: trailKeys.progress(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.content(trailId) });

      // Invalidate gamification data
      queryClient.invalidateQueries({ queryKey: gamificationKeys.missions() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streak() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.todayActivity() });
    },
  });
}

export function useMarkTrailArticleRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, contentId }: any) =>
      markTrailArticleRead(trailId, contentId),
    onSuccess: (_, { trailId }) => {
      // Invalidate trail progress
      queryClient.invalidateQueries({ queryKey: trailKeys.progress(trailId) });
      queryClient.invalidateQueries({ queryKey: trailKeys.content(trailId) });

      // Invalidate gamification data
      queryClient.invalidateQueries({ queryKey: gamificationKeys.missions() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streak() });
      queryClient.invalidateQueries({ queryKey: gamificationKeys.todayActivity() });
    },
  });
}
```

---

## 2. Create UI Components

### Trail Card Component
**File**: `apps/native/features/trails/components/trail-card.tsx`

Display trail in list view with:
- Title, description, difficulty badge
- Progress percentage (if enrolled)
- Completion status
- Lock icon if prerequisites not met

### Trail Content Item Component
**File**: `apps/native/features/trails/components/trail-content-item.tsx`

Display single content item with:
- Content type icon (question/quiz/article)
- Title
- Completion checkmark
- Points/score
- Lock icon if previous content not complete

---

## 3. Create Screens

### Trails List Screen
**File**: `apps/native/app/(app)/(tabs)/trails/index.tsx`

Features:
- List all available trails
- Filter by difficulty/category
- Show enrollment status
- Navigate to trail detail

### Trail Detail Screen
**File**: `apps/native/app/(app)/trails/[id]/index.tsx`

Features:
- Show trail info (title, description, difficulty, points)
- Display progress bar if enrolled
- Show content list with completion status
- Enroll button if not enrolled
- Start/Continue button

### Trail Content Screen
**File**: `apps/native/app/(app)/trails/[id]/content/[contentId].tsx`

This screen handles rendering different content types:

```typescript
// Determine content type and render accordingly
if (content.contentType === 'question') {
  // Render question with submission
  // Use useSubmitTrailQuestion hook
}

if (content.contentType === 'quiz') {
  // Start quiz with useStartTrailQuiz
  // Render quiz questions
  // Submit with useSubmitTrailQuiz
}

if (content.contentType === 'article') {
  // Render article content
  // Add "Mark as Read" button
  // Use useMarkTrailArticleRead hook
}
```

---

## 4. Integration Checklist

### Gamification Hooks Already Implemented ✅
- `useUserStreak()` - Get streak data
- `useUserMissions()` - Get missions
- `useTodayActivity()` - Get daily stats
- `useRecordActivity()` - Record any activity

### Where to Call Activity Recording

**Important**: The backend already handles activity recording automatically when you submit questions/quizzes/articles in trails. You do NOT need to manually call `useRecordActivity()` for trail activities.

However, for standalone activities outside trails, you should call it:

1. **Standalone Questions** (not in trail)
   - After submitting question answer
   - `recordActivity({ type: "question", metadata: { questionId, timeSpentMinutes } })`

2. **Standalone Quizzes** (not in trail)
   - After submitting quiz
   - `recordActivity({ type: "quiz", metadata: { quizId, score, timeSpentMinutes } })`

3. **Standalone Articles** (not in trail)
   - After marking article as read
   - `recordActivity({ type: "article", metadata: { articleId } })`

4. **Bookmarking**
   - When user bookmarks an article
   - `recordActivity({ type: "bookmark", metadata: { articleId } })`

---

## 5. Important Backend Endpoints Reference

### Student Trails Endpoints (All require authentication)

```typescript
// List trails
GET /trails
Query params: difficulty, categoryId, status, search, page, limit

// Get single trail
GET /trails/:id

// Get user's trail progress
GET /trails/:id/progress

// Enroll in trail
POST /trails/:id/enroll

// Get trail content list
GET /trails/:id/content

// Submit question in trail
POST /trails/:id/questions/:questionId/submit
Body: { answer: any, timeSpentSeconds?: number }

// Start quiz in trail
POST /trails/:id/content/:contentId/quiz/start
Body: { ipAddress?: string, userAgent?: string }

// Submit quiz in trail
POST /trails/:id/content/:contentId/quiz/submit/:attemptId
Body: { answers: [...], timeSpent?: number }

// Mark article as read in trail
POST /trails/:id/content/:contentId/article/mark-read
```

---

## 6. Testing Strategy

### Backend Testing (Already Complete) ✅
- Server compiles and runs
- All endpoints registered
- Gamification integration working

### Native App Testing (To Do)

1. **Trail List**
   - [ ] Trails load correctly
   - [ ] Filters work
   - [ ] Enrollment status shows

2. **Trail Detail**
   - [ ] Trail info displays
   - [ ] Progress shows correctly
   - [ ] Content list renders
   - [ ] Enroll button works

3. **Question in Trail**
   - [ ] Question loads
   - [ ] All 4 types render correctly (multiple_choice, true_false, fill_in_the_blank, matching)
   - [ ] Submission works
   - [ ] Progress updates
   - [ ] Missions update

4. **Quiz in Trail**
   - [ ] Quiz starts
   - [ ] Questions render
   - [ ] Submission works
   - [ ] Score calculated correctly
   - [ ] Content marked complete if passing
   - [ ] Missions update

5. **Article in Trail**
   - [ ] Article renders
   - [ ] Mark as read works
   - [ ] Content marked complete
   - [ ] Missions update

6. **Trail Completion**
   - [ ] Trail completes when all required content done
   - [ ] Score calculated correctly
   - [ ] Pass/fail determined correctly
   - [ ] Dependent trails unlock

---

## 7. Known Issues & Considerations

### Backend
- ✅ All critical issues resolved
- ✅ Gamification fully integrated
- ✅ Score calculation implemented
- ✅ All question types supported

### Native App
- Need to handle loading states
- Need to handle error states
- Consider offline support for trail content
- Consider caching completed content

### Design Considerations
- Match existing app design patterns (see missions screen for reference)
- Use same header style as missions/articles
- Use same card style as mission cards
- Keep navigation consistent

---

## 8. File Structure Summary

```
apps/native/
├── features/
│   ├── trails/
│   │   ├── api.ts                    # ← Create
│   │   ├── hooks.ts                  # ← Create
│   │   └── components/
│   │       ├── trail-card.tsx        # ← Create
│   │       └── trail-content-item.tsx # ← Create
│   └── gamification/
│       ├── api.ts                    # ✅ Exists
│       └── hooks.ts                  # ✅ Exists
└── app/
    └── (app)/
        ├── (tabs)/
        │   └── trails/
        │       └── index.tsx         # ← Create (list)
        └── trails/
            └── [id]/
                ├── index.tsx         # ← Create (detail)
                └── content/
                    └── [contentId].tsx # ← Create (content)
```

---

## 9. Quick Start for Next Session

1. **Start with API layer**: Create `api.ts` and `hooks.ts` files
2. **Test with existing data**: Use Swagger/Postman to verify endpoints
3. **Build UI incrementally**: Start with trail list, then detail, then content
4. **Test gamification**: Verify missions update after trail activities
5. **Polish UI**: Match existing app design patterns

---

## References

- Backend implementation: `apps/server/src/modules/trails/progress.service.ts`
- Backend endpoints: `apps/server/src/modules/trails/index.ts`
- Gamification: `apps/server/src/modules/gamification/`
- Existing missions UI: `apps/native/app/(app)/missions/index.tsx`
- Existing article UI: `apps/native/app/(app)/article/[id].tsx`

---

**Last Updated**: 2025-11-12
**Backend Status**: ✅ Complete and Tested
**Next Phase**: Native App Implementation
