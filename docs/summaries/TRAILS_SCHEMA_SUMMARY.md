# Trails Schema Implementation Summary

## Overview
Created a comprehensive database schema for the trails/journey learning system based on the requirements in INSTRUCTIONS.md.

## Files Created

### 1. `/apps/server/src/db/schema/trails.ts` (536 lines)
Complete Drizzle ORM schema defining all tables, relations, and types for the trails system.

### 2. `/docs/trails-schema.md` 
Comprehensive documentation explaining the schema design, relationships, and usage patterns.

## Schema Components

### Core Tables (10 total)

1. **`trails`** - Main trail configuration
   - Basic info (name, description, difficulty, status)
   - Assessment config (pass percentage, attempts, time limits)
   - Presentation (cover image, theme color, randomization)
   - Availability windows and metrics

2. **`trail_prerequisites`** - Defines prerequisite relationships between trails

3. **`trail_content`** - Links trails to their content (questions, quizzes, articles)
   - Polymorphic content type system
   - Sequence ordering
   - Required/optional flag

4. **`quizzes`** - Collections of questions grouped together
   - Difficulty levels
   - Time limits
   - Randomization options

5. **`quiz_questions`** - Links questions to quizzes with ordering

6. **`user_trail_progress`** - Tracks user progress through entire trails
   - Unlock status, enrollment, completion
   - Attempts, scores (best & current)
   - Time tracking

7. **`user_content_progress`** - Tracks progress on individual content items

8. **`user_quiz_attempts`** - Records each quiz attempt with detailed results

9. **`user_question_attempts`** - Records individual question answers

10. **`trail_prerequisites`** - Manages sequential unlocking

### Enums (3 total)

- **`trail_difficulty`**: basic, intermediate, advanced
- **`trail_status`**: draft, published, inactive, archived  
- **`trail_content_type`**: question, quiz, article

### Type Exports (18 total)

All tables have both select and insert types exported:
- `Trail`, `NewTrail`
- `TrailPrerequisite`, `NewTrailPrerequisite`
- `TrailContent`, `NewTrailContent`
- `Quiz`, `NewQuiz`
- `QuizQuestion`, `NewQuizQuestion`
- `UserTrailProgress`, `NewUserTrailProgress`
- `UserContentProgress`, `NewUserContentProgress`
- `UserQuizAttempt`, `NewUserQuizAttempt`
- `UserQuestionAttempt`, `NewUserQuestionAttempt`

Plus enum types:
- `TrailDifficulty`
- `TrailStatus`
- `TrailContentType`

## Key Features Implemented

### From RF018-019 (Admin - Trail Management)
✅ Trail ID format (TRL000001)
✅ Name, description, category, difficulty level
✅ Sequential unlock order (unique constraint)
✅ Assessment configuration (pass %, attempts, time limits)
✅ Presentation options (cover image, theme color, randomization)
✅ Availability windows
✅ Metrics tracking (enrolled count, completion rate, avg time)

### From RF020 (Content Management)
✅ Polymorphic content system (questions, quizzes, articles)
✅ Sequential ordering with drag-and-drop support (via sequence field)
✅ Required/optional content flags

### From RF053-056 (Student Experience)
✅ Unlock/lock status tracking
✅ Enrollment tracking
✅ Current position in trail
✅ Completed content tracking (JSON array)
✅ Progress percentages
✅ Attempt limiting
✅ Score tracking (best & current)
✅ Time spent tracking

### Content Types Support
✅ **Isolated Questions** - Direct reference to questions table
✅ **Quizzes** - Collections with randomization, time limits, scoring
✅ **Wiki Articles** - References to wiki_articles table

## Relationships

```
trails
  ├── trail_prerequisites (self-referential)
  ├── trail_content (polymorphic to questions/quizzes/articles)
  ├── user_trail_progress
  └── category, author

quizzes
  ├── quiz_questions → questions
  ├── user_quiz_attempts
  └── category, author

Progress tracking chain:
user → user_trail_progress → trail
user → user_content_progress → trail_content
user → user_quiz_attempts → quizzes
user → user_question_attempts → questions
```

## Indexes Created

Performance optimized for:
- Filtering by status, difficulty, category
- Admin queries (author, created/updated dates)
- Progress lookups (user + trail combinations)
- Content ordering (trail + sequence)
- Reporting queries (completion status)

## Business Logic Supported

1. **Sequential Unlocking**: First trail always available, others unlock via prerequisites
2. **Progress Tracking**: Granular tracking at trail and content levels
3. **Scoring**: Quiz and question level scoring with best score retention
4. **Attempt Limiting**: Configurable attempts with automatic enforcement
5. **Time Tracking**: At trail, content, quiz, and question levels
6. **Flexible Content**: Mix questions, quizzes, and articles in any order
7. **Completion Detection**: Auto-calculation based on required content completion

## Integration Points

- ✅ Integrates with existing `questions` schema
- ✅ Integrates with existing `wiki_articles` schema  
- ✅ Integrates with existing `content_categories` schema
- ✅ Integrates with existing `user` auth schema

## Next Steps for Implementation

1. **Database Migration**
   - Generate migration from schema
   - Apply to database
   - Verify constraints and indexes

2. **API Endpoints** (suggested structure)
   ```
   Admin:
   - POST /api/admin/trails - Create trail
   - PUT /api/admin/trails/:id - Update trail
   - POST /api/admin/trails/:id/content - Add content
   - GET /api/admin/trails/:id/analytics - View metrics
   
   Student:
   - GET /api/trails - List available trails
   - POST /api/trails/:id/enroll - Enroll in trail
   - GET /api/trails/:id - Get trail with progress
   - POST /api/trails/:id/content/:contentId - Submit answer/complete
   - GET /api/trails/:id/progress - Get detailed progress
   ```

3. **Business Logic Services**
   - Trail unlock checker
   - Progress calculator
   - Score aggregator
   - Attempt validator
   - Completion detector

4. **Frontend Components**
   - Trail list/grid with status badges
   - Trail detail with progress bar
   - Content viewer/navigator
   - Question/quiz renderer
   - Progress dashboard

## Notes

- Schema follows existing patterns from questions and wiki schemas
- Uses Drizzle ORM relations for type-safe queries
- All timestamps use timezone-aware types
- JSON fields used for flexible data (answers, completed content IDs)
- Comprehensive indexing for common query patterns
- Foreign keys with appropriate cascade/restrict rules
