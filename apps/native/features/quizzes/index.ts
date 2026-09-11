/**
 * Quizzes Feature Module
 * Provides reusable quiz components and quiz attempt management
 */

export type * from "./types";

// `QuizAttempt` and `QuizResults` are both types in ./types and components in
// ./components, so the components are aliased here to keep the barrel
// unambiguous.
export {
  QuizProgressBar,
  QuizReview,
  QuizTimer,
  QuizAttempt as QuizAttemptScreen,
  QuizResults as QuizResultsScreen,
} from "./components";
