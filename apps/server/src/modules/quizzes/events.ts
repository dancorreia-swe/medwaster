/**
 * Quizzes Module Events
 * Event types specific to quiz interactions
 */

import type { EventData } from "../events";

export const QUIZ_EVENTS = {
  STARTED: "quiz.started",
  COMPLETED: "quiz.completed",
  ABANDONED: "quiz.abandoned",
  QUESTION_ANSWERED: "quiz.question_answered",
} as const;

export interface QuizStartedData extends EventData {
  userId: string;
  quizId: number;
  quizName: string;
  totalQuestions: number;
  timeLimit?: number;
}

export interface QuizCompletedData extends EventData {
  userId: string;
  quizId: number;
  quizName: string;
  score: number;
  maxScore: number;
  percentageScore: number;
  questionsAnswered: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  isPerfect: boolean;
}

export interface QuizAbandonedData extends EventData {
  userId: string;
  quizId: number;
  questionsAnswered: number;
  totalQuestions: number;
  timeSpent: number;
  reason?: string;
}

export interface QuizQuestionAnsweredData extends EventData {
  userId: string;
  quizId: number;
  questionId: number;
  isCorrect: boolean;
  timeSpent: number;
  attempt: number;
}

// Register events in the global registry
declare module "@events/registry" {
  interface EventRegistry {
    "quiz.started": QuizStartedData;
    "quiz.completed": QuizCompletedData;
    "quiz.abandoned": QuizAbandonedData;
    "quiz.question_answered": QuizQuestionAnsweredData;
  }
}

