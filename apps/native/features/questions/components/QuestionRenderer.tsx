import { View, Text } from "react-native";
import { AlertTriangle } from "lucide-react-native";
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
        return <ErrorMessage message="Esta questão de múltipla escolha foi salva sem opções de resposta." />;
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
          <ErrorMessage message="Esta questão de verdadeiro ou falso não tem as duas alternativas." />
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
        return <ErrorMessage message="Esta questão de preenchimento foi salva sem espaços em branco." />;
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
        return <ErrorMessage message="Esta questão de relacionar colunas foi salva sem pares." />;
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
          message={`O tipo de questão "${question.type}" ainda não é exibido no aplicativo.`}
        />
      );
  }
}

/**
 * Shown when an admin-authored question cannot be rendered — it is missing the
 * variation rows its type needs. The learner gets a titled, iconified card with
 * an actionable next step rather than a bare grey sentence.
 */
function ErrorMessage({ message }: { message: string }) {
  return (
    <View
      accessibilityRole="alert"
      className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-amber-200 dark:border-amber-800 items-center gap-3"
    >
      <View className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/40 items-center justify-center">
        <AlertTriangle size={24} color="#D97706" strokeWidth={2.25} />
      </View>
      <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 text-center">
        Questão indisponível
      </Text>
      <Text className="text-base text-gray-600 dark:text-gray-400 text-center leading-relaxed">
        {message}
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-500 text-center">
        Siga para o próximo conteúdo e avise a equipe responsável.
      </Text>
    </View>
  );
}
