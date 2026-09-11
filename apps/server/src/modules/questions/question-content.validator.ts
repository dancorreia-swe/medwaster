import type { QuestionType } from "@/db/schema/questions";
import { ValidationError } from "@/lib/errors";
import type { CreateQuestionBody, UpdateQuestionBody } from "./model";

const QUESTION_TYPE_REQUIREMENTS = {
  multiple_choice: "options",
  true_false: "options",
  fill_in_the_blank: "fillInBlanks",
  matching: "matchingPairs",
} as const;

/** A true/false question is exactly two mutually exclusive alternatives. */
const TRUE_FALSE_OPTION_COUNT = 2;

/** A single-alternative "choice" is not a choice. */
const MULTIPLE_CHOICE_MIN_OPTIONS = 2;

type QuestionBody = CreateQuestionBody | UpdateQuestionBody;
type Options = NonNullable<QuestionBody["options"]>;
type FillInBlanks = NonNullable<QuestionBody["fillInBlanks"]>;

/**
 * Validate that a question's variations can actually be rendered and graded.
 *
 * The type schema only constrains the shape of each row, and this used to only
 * check that the required array was non-empty. That let the admin API accept
 * questions the app cannot present or score — a true/false with one option, a
 * multiple choice with no correct answer, a blank with neither an answer nor a
 * correct option (which previously reached the service and surfaced as a 500
 * from inside a transaction rather than a 400).
 *
 * These mirror the constraints the admin form already enforces client-side, so
 * they reject only payloads that the UI could not have produced.
 */
export function validateQuestionData(
  data: QuestionBody,
  persistedType?: QuestionType,
) {
  const type = data.type ?? persistedType;
  if (!type) return;

  const requiredField = QUESTION_TYPE_REQUIREMENTS[type];
  const hasRequiredData = data[requiredField as keyof typeof data];

  // On a patch that does not touch the variation and does not change the type,
  // the persisted rows still stand and there is nothing to check.
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
    case "true_false":
      validateTrueFalseOptions(hasRequiredData as Options);
      break;
    case "multiple_choice":
      validateMultipleChoiceOptions(hasRequiredData as Options);
      break;
    case "fill_in_the_blank":
      validateFillInBlanks(hasRequiredData as FillInBlanks);
      break;
    case "matching":
      break;
  }
}

function validateTrueFalseOptions(options: Options) {
  if (options.length !== TRUE_FALSE_OPTION_COUNT) {
    throw new ValidationError(
      `Question type "true_false" requires exactly ${TRUE_FALSE_OPTION_COUNT} options, received ${options.length}`,
    );
  }

  const correctCount = options.filter((option) => option.isCorrect).length;
  if (correctCount !== 1) {
    throw new ValidationError(
      `Question type "true_false" requires exactly one correct option, received ${correctCount}`,
    );
  }
}

function validateMultipleChoiceOptions(options: Options) {
  if (options.length < MULTIPLE_CHOICE_MIN_OPTIONS) {
    throw new ValidationError(
      `Question type "multiple_choice" requires at least ${MULTIPLE_CHOICE_MIN_OPTIONS} options, received ${options.length}`,
    );
  }

  if (!options.some((option) => option.isCorrect)) {
    throw new ValidationError(
      `Question type "multiple_choice" requires at least one correct option`,
    );
  }
}

function validateFillInBlanks(blanks: FillInBlanks) {
  blanks.forEach((blank, index) => {
    const position = blank.sequence ?? index + 1;
    const options = blank.options ?? [];

    // The service resolves a blank's answer as `answer ?? correct option text`,
    // so a blank with neither cannot be stored.
    const hasCorrectOption = options.some((option) => option.isCorrect);
    if (!blank.answer && !hasCorrectOption) {
      throw new ValidationError(
        `Fill-in-the-blank #${position} requires either an answer or a correct option`,
      );
    }

    if (options.length > 0 && !hasCorrectOption) {
      throw new ValidationError(
        `Fill-in-the-blank #${position} has options but none marked correct`,
      );
    }
  });
}
