import type { QuestionType } from "@/db/schema/questions";
import { ValidationError } from "@/lib/errors";
import type { CreateQuestionBody, UpdateQuestionBody } from "./model";

const QUESTION_TYPE_REQUIREMENTS = {
  multiple_choice: "options",
  true_false: "options",
  fill_in_the_blank: "fillInBlanks",
  matching: "matchingPairs",
} as const;

export function validateQuestionData(
  data: CreateQuestionBody | UpdateQuestionBody,
  persistedType?: QuestionType,
) {
  const type = data.type ?? persistedType;
  if (!type) return;

  const requiredField = QUESTION_TYPE_REQUIREMENTS[type];
  const hasRequiredData = data[requiredField as keyof typeof data];

  const shouldValidateRequiredData =
    persistedType === undefined ||
    data.type !== undefined ||
    hasRequiredData !== undefined;

  if (!shouldValidateRequiredData) return;

  if (
    !hasRequiredData ||
    (Array.isArray(hasRequiredData) && hasRequiredData.length === 0)
  ) {
    throw new ValidationError(
      `Question type "${type}" requires "${requiredField}" to be provided`,
    );
  }
}
