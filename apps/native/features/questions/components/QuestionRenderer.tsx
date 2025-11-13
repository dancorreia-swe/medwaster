import { View, Text } from "react-native";
import type { Question, QuestionAnswer, QuestionResult } from "../types";
import { MultipleChoiceQuestion } from "./MultipleChoiceQuestion";
import { TrueFalseQuestion } from "./TrueFalseQuestion";
import { FillInBlankQuestion } from "./FillInBlankQuestion";
import { MatchingQuestion } from "./MatchingQuestion";

/**
 * Question Renderer Component
 * Automatically renders the correct question component based on question type
 */
interface QuestionRendererProps {
  question: Question;
  onSubmit: (answer: QuestionAnswer) => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  result?: QuestionResult | null;
  showResult?: boolean;
}

export function QuestionRenderer({
  question,
  onSubmit,
  isSubmitting = false,
  disabled = false,
}: QuestionRendererProps) {
  switch (question.type) {
    case "multiple_choice":
      if (!question.options || question.options.length === 0) {
        return <ErrorMessage message="Questão de múltipla escolha sem opções" />;
      }
      return (
        <MultipleChoiceQuestion
          question={question as any}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          disabled={disabled}
        />
      );

    case "true_false":
      if (!question.options || question.options.length < 2) {
        return (
          <ErrorMessage message="Questão verdadeiro/falso precisa de 2 opções" />
        );
      }
      return (
        <TrueFalseQuestion
          question={question as any}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          disabled={disabled}
        />
      );

    case "fill_in_the_blank":
      if (!question.fillInBlanks || question.fillInBlanks.length === 0) {
        return <ErrorMessage message="Questão de preencher sem espaços em branco" />;
      }
      return (
        <FillInBlankQuestion
          question={question as any}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          disabled={disabled}
        />
      );

    case "matching":
      if (!question.matchingPairs || question.matchingPairs.length === 0) {
        return <ErrorMessage message="Questão de relacionar sem pares" />;
      }
      return (
        <MatchingQuestion
          question={question as any}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          disabled={disabled}
        />
      );

    default:
      return (
        <ErrorMessage
          message={`Tipo de questão não suportado: ${question.type}`}
        />
      );
  }
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <View className="bg-white rounded-xl p-6 border border-gray-200">
      <Text className="text-gray-600 text-center">{message}</Text>
    </View>
  );
}
