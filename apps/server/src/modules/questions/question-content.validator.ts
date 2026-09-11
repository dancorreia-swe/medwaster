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

  switch (type) {
    case "multiple_choice":
      validateChoiceOptions(data.options, "Multiple-choice");
      break;
    case "true_false":
      validateTrueFalseOptions(data.options);
      break;
    case "fill_in_the_blank":
      validateFillInBlanks(data.fillInBlanks);
      break;
    case "matching":
      validateMatchingPairs(data.matchingPairs);
      break;
  }
}

function validateChoiceOptions(
  options: CreateQuestionBody["options"] | UpdateQuestionBody["options"],
  label: string,
) {
  if (!options) return;

  if (options.length < 2) {
    throw new ValidationError(`${label} questions require at least two options`);
  }

  if (options.some((option) => !option.content.trim())) {
    throw new ValidationError(`${label} options cannot be empty`);
  }

  if (options.filter((option) => option.isCorrect).length !== 1) {
    throw new ValidationError(`${label} questions require exactly one correct option`);
  }
}

function validateTrueFalseOptions(
  options: CreateQuestionBody["options"] | UpdateQuestionBody["options"],
) {
  validateChoiceOptions(options, "True/false");
  if (!options) return;

  const values = new Set(options.map((option) => option.content.trim().toLowerCase()));
  if (!values.has("verdadeiro") || !values.has("falso") || values.size !== 2) {
    throw new ValidationError('True/false questions require the "Verdadeiro" and "Falso" options');
  }
}

function validateFillInBlanks(
  blanks: CreateQuestionBody["fillInBlanks"] | UpdateQuestionBody["fillInBlanks"],
) {
  if (!blanks) return;

  const sequences = new Set<number>();
  for (const blank of blanks) {
    if (sequences.has(blank.sequence)) {
      throw new ValidationError("Fill-in-the-blank sequences must be unique");
    }
    sequences.add(blank.sequence);

    if (!blank.options || blank.options.length < 2) {
      throw new ValidationError(`Fill-in-the-blank #${blank.sequence} requires at least two options`);
    }
    if (blank.options.some((option) => !option.text.trim())) {
      throw new ValidationError(`Fill-in-the-blank #${blank.sequence} options cannot be empty`);
    }
    if (blank.options.filter((option) => option.isCorrect).length !== 1) {
      throw new ValidationError(`Fill-in-the-blank #${blank.sequence} requires exactly one correct option`);
    }
  }
}

function validateMatchingPairs(
  pairs: CreateQuestionBody["matchingPairs"] | UpdateQuestionBody["matchingPairs"],
) {
  if (!pairs) return;

  if (pairs.length < 2) {
    throw new ValidationError("Matching questions require at least two pairs");
  }
  if (pairs.some((pair) => !pair.leftText.trim() || !pair.rightText.trim())) {
    throw new ValidationError("Matching pairs cannot be empty");
  }
  if (new Set(pairs.map((pair) => pair.sequence)).size !== pairs.length) {
    throw new ValidationError("Matching pair sequences must be unique");
  }
}
