/**
 * Quiz Types and Interfaces
 * Based on backend schema and API responses
 */

import type { Question, QuestionAnswer } from "../questions/types";

export type QuizDifficulty = "basic" | "intermediate" | "advanced" | "mixed";

export type QuizStatus = "draft" | "active" | "inactive" | "archived";

export type QuizAttemptStatus = "in_progress" | "completed" | "abandoned";

// ============================================================================
// Quiz Question (question within a quiz context)
// ============================================================================

export interface QuizQuestion {
  id: number; // quiz_questions.id
  quizId: number;
  questionId: number;
  sequence: number;
  points: number;
  question: Question; // Full question data with type-specific fields
}

// ============================================================================
// Quiz
// ============================================================================

export interface Quiz {
  id: number;
  title: string;
  description?: string | null;
  instructions?: string | null;
  difficulty: QuizDifficulty;
  status: QuizStatus;
  categoryId?: number | null;
  authorId: string;
  timeLimit?: number | null; // in minutes
  maxAttempts: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  passingScore: number; // percentage
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations
  questions?: QuizQuestion[];
}

// ============================================================================
// Quiz Attempt
// ============================================================================

export interface QuizAttempt {
  id: number;
  quizId: number;
  userId: string;
  status: QuizAttemptStatus;
  score?: number | null; // percentage
  earnedPoints?: number | null;
  totalPoints: number;
  startedAt: string;
  completedAt?: string | null;
  timeSpentSeconds?: number | null;
  trailContentId?: number | null; // If part of a trail
  ipAddress?: string | null;
  userAgent?: string | null;

  // Relations
  quiz?: Quiz;
  answers?: QuizAnswer[];
}

// ============================================================================
// Quiz Answer (individual answer in an attempt)
// ============================================================================

export interface QuizAnswer {
  id: number;
  attemptId: number;
  quizQuestionId: number; // quiz_questions.id
  questionId: number;
  selectedOptions?: number[] | null; // For multiple choice
  textAnswer?: string | null; // For fill-in-blank
  matchingAnswers?: Record<string, string> | null; // For matching
  isCorrect: boolean;
  earnedPoints: number;
  timeSpentSeconds?: number | null;
  answeredAt: string;

  // Populated in results
  question?: Question;
  correctAnswer?: any;
}

// ============================================================================
// Quiz Attempt Progress (for UI state management)
// ============================================================================

export interface QuizAttemptProgress {
  attemptId: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: Map<number, QuestionAnswer>; // quizQuestionId -> answer
  timeRemaining?: number | null; // seconds remaining if time limit
  startTime: Date;
}

// ============================================================================
// Quiz Results
// ============================================================================

export interface QuizResults {
  attempt: QuizAttempt;
  score: number; // percentage
  earnedPoints: number;
  totalPoints: number;
  correctCount: number;
  incorrectCount: number;
  passed: boolean;
  timeSpentSeconds: number;
  answers: QuizAnswer[];
}

// ============================================================================
// Component Props
// ============================================================================

export interface QuizAttemptProps {
  quiz: Quiz;
  attemptId: number;
  onComplete: (results: QuizResults) => void;
  onExit?: () => void;
  trailContext?: {
    trailId: number;
    contentId: number;
  };
}

export interface QuizResultsProps {
  results: QuizResults;
  onContinue: () => void;
  onReview?: () => void;
  showReviewButton?: boolean;
}

export interface QuizProgressBarProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number;
}

export interface QuizTimerProps {
  timeLimit: number; // in minutes
  startTime: Date;
  onTimeUp: () => void;
}
