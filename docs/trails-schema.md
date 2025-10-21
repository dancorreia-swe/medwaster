# Trails/Journey Schema Documentation

This document describes the database schema for the trails (learning journeys) system in MedWaster Learning.

## Overview

The trails system provides a linear, structured learning experience that guides students through medical waste management education. Each trail contains a sequence of content items (questions, quizzes, and wiki articles) that users complete in order.

## Core Tables

### 1. `trails`

Main table storing trail configuration and metadata.

**Key Fields:**
- `id`: Serial primary key
- `uuid`: UUID for external references
- `trailId`: Human-readable ID (format: TRL000001)
- `name`: Trail name (max 120 chars)
- `description`: Trail description/objective (max 500 chars)
- `difficulty`: Enum (basic, intermediate, advanced)
- `status`: Enum (draft, published, inactive, archived)
- `unlockOrder`: Unique integer defining sequential unlock order

**Assessment Configuration:**
- `passPercentage`: Minimum score to pass (50-95%, default 70%)
- `attemptsAllowed`: Number of attempts (1-5, default 3)
- `timeLimitMinutes`: Optional time limit per session
- `allowSkipQuestions`: Allow skipping questions (default false)
- `showImmediateExplanations`: Show explanations after each question (default true)

**Presentation:**
- `randomizeContentOrder`: Randomize content sequence (default false)
- `coverImageUrl`: Trail cover image
- `themeColor`: Custom theme color (hex)

**Advanced:**
- `availableFrom`/`availableUntil`: Availability time window
- `estimatedTimeMinutes`: Auto-calculated completion time
- `customCertificate`: Use custom certificate design

**Metrics:**
- `enrolledCount`: Total enrolled users
- `completionRate`: Percentage who completed
- `averageCompletionMinutes`: Average time to complete

**Relationships:**
- `categoryId` → `content_categories`
- `authorId` → `user`

### 2. `trail_prerequisites`

Defines prerequisite relationships between trails.

**Fields:**
- `trailId`: Trail requiring prerequisites
- `prerequisiteTrailId`: Trail that must be completed first

**Business Rules:**
- First trail (unlockOrder = 1) has no prerequisites
- System prevents circular dependencies
- Users must pass prerequisite to unlock next trail

### 3. `trail_content`

Junction table linking trails to their content items.

**Fields:**
- `trailId`: Parent trail
- `contentType`: Enum (question, quiz, article)
- `contentId`: ID of the referenced content
- `sequence`: Order within trail
- `isRequired`: Whether content is mandatory

**Content Types:**
- **question**: Individual question from `questions` table
- **quiz**: Quiz from `quizzes` table (collection of questions)
- **article**: Wiki article from `wiki_articles` table

### 4. `quizzes`

Collection of questions grouped together.

**Key Fields:**
- `title`: Quiz name
- `description`: Quiz description
- `difficulty`: Matching trail difficulty enum
- `timeLimitMinutes`: Optional time limit
- `randomizeQuestions`: Randomize question order
- `showResults`: Show results after completion

**Relationships:**
- `categoryId` → `content_categories`
- `authorId` → `user`

### 5. `quiz_questions`

Links questions to quizzes with ordering and points.

**Fields:**
- `quizId` → `quizzes`
- `questionId` → `questions`
- `sequence`: Order within quiz
- `points`: Points awarded for correct answer (default 1)

## Progress Tracking Tables

### 6. `user_trail_progress`

Tracks overall user progress through a trail.

**Status Fields:**
- `isUnlocked`: Trail is available to user
- `isEnrolled`: User started the trail
- `isCompleted`: User finished all content
- `isPassed`: User met pass percentage

**Progress Tracking:**
- `currentContentId`: Current position in trail
- `completedContentIds`: JSON array of completed content IDs
- `attempts`: Number of attempts made
- `bestScore`: Best score achieved
- `currentScore`: Score in current attempt
- `timeSpentMinutes`: Total time spent

**Timestamps:**
- `enrolledAt`: When user started
- `lastAccessedAt`: Last activity time
- `completedAt`: When user finished

### 7. `user_content_progress`

Tracks progress on individual content items within a trail.

**Fields:**
- `userId` + `trailContentId`: Unique combination
- `isCompleted`: Content item completed
- `score`: Score achieved (if applicable)
- `timeSpentMinutes`: Time spent on this content
- `attempts`: Number of attempts
- `completedAt`: Completion timestamp

### 8. `user_quiz_attempts`

Records each quiz attempt by a user.

**Fields:**
- `userId` + `quizId`: User and quiz
- `trailContentId`: Optional link to trail context
- `score`: Final score as percentage
- `totalQuestions`: Number of questions in quiz
- `correctAnswers`: Number of correct answers
- `timeSpentMinutes`: Time taken
- `answers`: JSON object with detailed answers
- `completedAt`: Completion timestamp

### 9. `user_question_attempts`

Records individual question answers.

**Fields:**
- `userId` + `questionId`: User and question
- `trailContentId`: Optional trail context
- `quizAttemptId`: Optional quiz context
- `isCorrect`: Whether answer was correct
- `userAnswer`: JSON with answer data
- `timeSpentSeconds`: Time spent on question

## Key Relationships

```
trails (1) ----< (N) trail_content
                      |
                      +-- contentType = "question" --> questions
                      +-- contentType = "quiz" --> quizzes ----< quiz_questions --> questions
                      +-- contentType = "article" --> wiki_articles

trails (1) ----< (N) trail_prerequisites (N) >---- (1) trails

trails (1) ----< (N) user_trail_progress (N) >---- (1) user

trail_content (1) ----< (N) user_content_progress (N) >---- (1) user

quizzes (1) ----< (N) user_quiz_attempts (N) >---- (1) user

questions (1) ----< (N) user_question_attempts (N) >---- (1) user
```

## Enums

### trail_difficulty
- `basic`: Introductory level
- `intermediate`: Intermediate level
- `advanced`: Advanced level

### trail_status
- `draft`: Being created, not visible to students
- `published`: Active and available
- `inactive`: Temporarily disabled
- `archived`: No longer available

### trail_content_type
- `question`: Single isolated question
- `quiz`: Collection of multiple questions
- `article`: Wiki article for reading

## Indexes

Optimized for common queries:

**Trails:**
- Status, difficulty, category (filtering)
- Author, unlock order (admin queries)
- Created/updated timestamps (sorting)

**Progress:**
- User + Trail combinations (progress lookup)
- Completion status (reporting)
- Quiz/question attempts by user (history)

**Content:**
- Trail + sequence (content ordering)
- Content type + ID (polymorphic lookups)

## Business Logic

### Trail Unlocking
1. First trail (unlockOrder = 1) is always unlocked
2. User must complete and pass prerequisite trails
3. Passing requires: score >= passPercentage
4. System checks prerequisites before allowing enrollment

### Content Progression
1. Users progress through content sequentially
2. Content can be marked optional (isRequired = false)
3. Progress saved after each content item
4. Trail completion requires all required content

### Scoring
- Quiz score = (correctAnswers / totalQuestions) * 100
- Trail score = average of all quiz/question scores
- Best score is retained across attempts
- Must meet passPercentage to unlock next trail

### Attempts
- Users get `attemptsAllowed` chances per trail
- Each attempt can improve best score
- Failed attempts don't block progress if attempts remain
- After max attempts, user must request reset (admin)

## Integration Notes

### With Questions Schema
- Questions maintain their own configuration (type, difficulty, options)
- Can be used standalone or within quizzes
- Same question can appear in multiple quizzes/trails

### With Wiki Schema
- Articles provide theoretical foundation
- Can be referenced as trail content
- Read-only within trail context
- User tracking via user_content_progress

### With Categories Schema
- Both trails and content share category system
- Enables filtering by medical waste type
- Maintains consistency across learning materials

## Migration Considerations

When implementing this schema:

1. Create enums first (trail_difficulty, trail_status, trail_content_type)
2. Create base tables (trails, quizzes)
3. Create junction tables (trail_prerequisites, trail_content, quiz_questions)
4. Create progress tracking tables
5. Add foreign key constraints
6. Create indexes for performance

## Example Queries

### Get unlocked trails for user
```sql
SELECT t.* FROM trails t
LEFT JOIN trail_prerequisites tp ON t.id = tp.trail_id
LEFT JOIN user_trail_progress utp ON tp.prerequisite_trail_id = utp.trail_id 
  AND utp.user_id = ?
WHERE t.status = 'published'
  AND (tp.prerequisite_trail_id IS NULL OR utp.is_passed = true)
ORDER BY t.unlock_order;
```

### Get trail content with progress
```sql
SELECT tc.*, ucp.is_completed, ucp.score
FROM trail_content tc
LEFT JOIN user_content_progress ucp ON tc.id = ucp.trail_content_id 
  AND ucp.user_id = ?
WHERE tc.trail_id = ?
ORDER BY tc.sequence;
```

### Calculate trail completion percentage
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN ucp.is_completed THEN 1 ELSE 0 END) as completed,
  (SUM(CASE WHEN ucp.is_completed THEN 1 ELSE 0 END)::float / COUNT(*) * 100) as percentage
FROM trail_content tc
LEFT JOIN user_content_progress ucp ON tc.id = ucp.trail_content_id 
  AND ucp.user_id = ?
WHERE tc.trail_id = ? AND tc.is_required = true;
```
