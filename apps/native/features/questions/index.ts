/**
 * Questions Feature Module
 * Provides reusable question components for all question types
 */

export type * from "./types";

// `QuestionResult` is both a type in ./types and a component in ./components,
// so the component is aliased here to keep the barrel unambiguous.
export {
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillInBlankQuestion,
  MatchingQuestion,
  MatchingPairsList,
  QuestionRenderer,
  QuestionResult as QuestionResultCard,
} from "./components";
