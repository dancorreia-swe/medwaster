/**
 * Question Types and Interfaces
 * Based on backend schema and API responses
 */

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_in_the_blank"
  | "matching";

export type QuestionDifficulty = "basic" | "intermediate" | "advanced";

export type QuestionStatus = "draft" | "active" | "inactive" | "archived";

// ============================================================================
// Question Option (for multiple choice and true/false)
// ============================================================================

export interface QuestionOption {
  id: number;
  label: string | null;
  content: string;  // Database field name (was optionText)
  optionText?: string;  // Keep for backward compatibility
  isCorrect: boolean;
  sequence?: number;  // Optional - database doesn't have this field
}

// ============================================================================
// Fill in the Blank
// ============================================================================

export interface FillBlankAnswer {
  id: number;
  sequence: number;
  placeholder: string;
  acceptedAnswers: string[]; // JSON array of acceptable answers
  isCaseSensitive: boolean;
  options?: FillBlankOption[]; // Optional multiple choice options for blank
}

export interface FillBlankOption {
  id: number;
  fillBlankId: number;
  text: string;  // Database field name - primary
  content?: string;  // Alias for compatibility
  optionText?: string;  // Keep for backward compatibility
  isCorrect: boolean;
  sequence: number;
}

// ============================================================================
// Matching Pairs
// ============================================================================

export interface MatchingPair {
  id: number;
  leftText: string;
  rightText: string;
  sequence: number;
}

// ============================================================================
// Question Base
// ============================================================================

export interface Question {
  id: number;
  prompt: string;
  questionText?: string; // Alias for prompt, used in some contexts
  explanation?: string | null;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  status: QuestionStatus;
  categoryId?: number | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  references?: string | null;
  createdAt: string;
  updatedAt: string;

  // Relations (optional based on question type)
  options?: QuestionOption[];
  fillInBlanks?: FillBlankAnswer[];
  matchingPairs?: MatchingPair[];
}

// ============================================================================
// Question Answer Types
// ============================================================================

// Multiple choice or true/false answer
export type MultipleChoiceAnswer = number; // option ID

// Fill in the blank answer (for submission)
export type FillBlankAnswerValue = string; // text answer
export type FillBlankAnswers = Record<string, string>; // { blankId: answer }

// Matching pairs answer
export type MatchingAnswer = Record<string, string>; // { leftId: rightId }

// Union type for all answer types
export type QuestionAnswer =
  | MultipleChoiceAnswer
  | FillBlankAnswerValue
  | FillBlankAnswers
  | MatchingAnswer
  | number[]; // Multiple select

// ============================================================================
// Question Result (after submission)
// ============================================================================

export interface QuestionResult {
  isCorrect: boolean;
  correctAnswer?:
    | number
    | number[]
    | string
    | Record<string, string>;
  explanation?: string;
  score?: number;
  earnedPoints?: number;
}

// ============================================================================
// Question Component Props
// ============================================================================

export interface BaseQuestionProps {
  question: Question;
  onSubmit: (answer: QuestionAnswer) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  result?: QuestionResult | null;
  showResult?: boolean;
}

export interface MultipleChoiceQuestionProps extends BaseQuestionProps {
  question: Question & { options: QuestionOption[] };
  allowMultiple?: boolean;
}

export interface TrueFalseQuestionProps extends BaseQuestionProps {
  question: Question & { options: QuestionOption[] };
}

export interface FillInBlankQuestionProps extends BaseQuestionProps {
  question: Question & { fillInBlanks: FillBlankAnswer[] };
}

export interface MatchingQuestionProps extends BaseQuestionProps {
  question: Question & { matchingPairs: MatchingPair[] };
}

// ============================================================================
// Question Result Props
// ============================================================================

export interface QuestionResultProps {
  result: QuestionResult;
  question?: Question; // Optional question object to format correct answer
  onContinue?: () => void; // Optional - button now handled by parent
  isLoading?: boolean;
}
