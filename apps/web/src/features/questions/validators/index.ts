import type { QuestionType } from "../types";
import { VALIDATION_MESSAGES } from "../constants";

export interface QuestionOption {
  label: string;
  content: string;
  isCorrect: boolean;
}

export interface FillBlank {
  sequence: number;
  placeholder: string;
  answer: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
}

export interface MatchingPair {
  leftText: string;
  rightText: string;
  sequence: number;
}

export interface QuestionFormValues {
  prompt: string;
  explanation: string;
  difficulty: "basic" | "intermediate" | "advanced";
  status: "draft" | "active" | "inactive" | "archived";
  categoryId: number | null;
  imageUrl: string;
  references: string;
}

interface ValidationContext {
  questionType: QuestionType;
  options: QuestionOption[];
  fillBlanks: FillBlank[];
  matchingPairs: MatchingPair[];
}

export function validateQuestionForm(
  values: QuestionFormValues,
  context: ValidationContext
): string[] {
  const errors: string[] = [];

  if (!values.prompt || values.prompt.trim() === "") {
    errors.push(VALIDATION_MESSAGES.PROMPT_REQUIRED);
  }

  switch (context.questionType) {
    case "multiple_choice":
      errors.push(...validateMultipleChoice(context.options));
      break;
    case "true_false":
      errors.push(...validateTrueFalse(context.options));
      break;
    case "fill_in_the_blank":
      errors.push(...validateFillBlanks(context.fillBlanks));
      break;
    case "matching":
      errors.push(...validateMatching(context.matchingPairs));
      break;
  }

  return errors;
}

function validateMultipleChoice(options: QuestionOption[]): string[] {
  const errors: string[] = [];

  const hasCorrect = options.some((opt) => opt.isCorrect);
  if (!hasCorrect) {
    errors.push(VALIDATION_MESSAGES.MULTIPLE_CHOICE_NO_CORRECT);
  }

  const allOptionsFilled = options.every((opt) => opt.content.trim() !== "");
  if (!allOptionsFilled) {
    errors.push(VALIDATION_MESSAGES.MULTIPLE_CHOICE_INCOMPLETE);
  }

  return errors;
}

function validateTrueFalse(options: QuestionOption[]): string[] {
  const errors: string[] = [];

  const hasCorrect = options.some((opt) => opt.isCorrect);
  if (!hasCorrect) {
    errors.push(VALIDATION_MESSAGES.TRUE_FALSE_NO_CORRECT);
  }

  return errors;
}

function validateFillBlanks(fillBlanks: FillBlank[]): string[] {
  const errors: string[] = [];

  if (fillBlanks.length === 0) {
    errors.push(VALIDATION_MESSAGES.FILL_BLANK_REQUIRED);
    return errors;
  }

  fillBlanks.forEach((blank, index) => {
    if (blank.options && blank.options.length > 0) {
      const hasCorrect = blank.options.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        errors.push(VALIDATION_MESSAGES.FILL_BLANK_NO_CORRECT(index));
      }

      const allFilled = blank.options.every((opt) => opt.text.trim() !== "");
      if (!allFilled) {
        errors.push(VALIDATION_MESSAGES.FILL_BLANK_INCOMPLETE(index));
      }
    } else {
      if (!blank.answer || blank.answer.trim() === "") {
        errors.push(VALIDATION_MESSAGES.FILL_BLANK_NO_ANSWER(index));
      }
    }
  });

  return errors;
}

function validateMatching(matchingPairs: MatchingPair[]): string[] {
  const errors: string[] = [];

  if (matchingPairs.length === 0) {
    errors.push(VALIDATION_MESSAGES.MATCHING_REQUIRED);
    return errors;
  }

  matchingPairs.forEach((pair, index) => {
    if (!pair.leftText || pair.leftText.trim() === "") {
      errors.push(VALIDATION_MESSAGES.MATCHING_LEFT_EMPTY(index));
    }
    if (!pair.rightText || pair.rightText.trim() === "") {
      errors.push(VALIDATION_MESSAGES.MATCHING_RIGHT_EMPTY(index));
    }
  });

  return errors;
}
