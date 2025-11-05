import { useState } from "react";
import type { QuestionType } from "../types";
import {
  DEFAULT_MULTIPLE_CHOICE_OPTIONS,
  DEFAULT_MATCHING_PAIRS,
} from "../constants";
import type {
  QuestionOption,
  FillBlank,
  MatchingPair,
} from "../validators";

export function useQuestionFormState(initialType: QuestionType = "multiple_choice") {
  const [questionType, setQuestionType] = useState<QuestionType>(initialType);
  const [options, setOptions] = useState<QuestionOption[]>([
    ...DEFAULT_MULTIPLE_CHOICE_OPTIONS,
  ]);
  const [fillBlanks, setFillBlanks] = useState<FillBlank[]>([]);
  const [matchingPairs, setMatchingPairs] = useState<MatchingPair[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleTypeChange = (newType: QuestionType) => {
    setQuestionType(newType);
    setFillBlanks([]);

    if (newType === "multiple_choice") {
      setOptions([...DEFAULT_MULTIPLE_CHOICE_OPTIONS]);
      setMatchingPairs([]);
    } else if (newType === "matching") {
      setMatchingPairs([...DEFAULT_MATCHING_PAIRS]);
      setOptions([]);
    } else {
      setOptions([]);
      setMatchingPairs([]);
    }
  };

  return {
    questionType,
    options,
    fillBlanks,
    matchingPairs,
    validationErrors,
    setOptions,
    setFillBlanks,
    setMatchingPairs,
    setValidationErrors,
    handleTypeChange,
  };
}
