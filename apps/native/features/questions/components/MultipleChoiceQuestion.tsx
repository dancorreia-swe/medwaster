import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Check } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { MultipleChoiceQuestionProps } from "../types";
import { HtmlText } from "@/components/HtmlText";

/**
 * Multiple Choice Question Component
 * Supports both single and multiple selection
 */
export function MultipleChoiceQuestion({
  question,
  onSubmit,
  isSubmitting = false,
  disabled = false,
  allowMultiple = false,
}: MultipleChoiceQuestionProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);

  const handleOptionPress = (optionId: number) => {
    if (disabled || isSubmitting) return;

    if (allowMultiple) {
      // Multiple selection
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId],
      );
    } else {
      // Single selection
      setSelectedOptions([optionId]);
    }
  };

  // Notify parent of answer changes
  useEffect(() => {
    if (selectedOptions.length > 0) {
      const answer = allowMultiple ? selectedOptions : selectedOptions[0];
      onSubmit(answer);
    }
  }, [selectedOptions, allowMultiple, onSubmit]);

  const isOptionSelected = (optionId: number) =>
    selectedOptions.includes(optionId);
  const hasSelection = selectedOptions.length > 0;

  // `question_options` has no ordering column, so primary key order is what the
  // admin editor's row order maps to.
  const sortedOptions = [...(question.options || [])].sort((a, b) => a.id - b.id);

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Question Image */}
      {question.imageUrl && (
        <Image
          source={{ uri: question.imageUrl }}
          className="w-full h-64 rounded-2xl mb-8"
          resizeMode="cover"
        />
      )}

      {/* Question Text */}
      <HtmlText html={question.prompt || question.questionText} />

      {/* Options */}
      <View
        className="gap-4"
        accessibilityRole="radiogroup"
        accessibilityLabel={
          allowMultiple
            ? "Opções de resposta, seleção múltipla"
            : "Opções de resposta"
        }
      >
        {sortedOptions.map((option, index) => {
          const isSelected = isOptionSelected(option.id);
          // The admin editor authors an explicit label (A, B, C…) and shows it in
          // the question detail view, so the learner sees the same marker.
          const label = option.label?.trim() || String.fromCharCode(65 + index);

          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleOptionPress(option.id)}
              disabled={disabled || isSubmitting}
              accessibilityRole={allowMultiple ? "checkbox" : "radio"}
              accessibilityState={{
                checked: isSelected,
                disabled: disabled || isSubmitting,
              }}
              accessibilityLabel={`Opção ${label}: ${option.content}`}
              className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border-2 ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-800"
              } ${disabled || isSubmitting ? "opacity-50" : ""}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-3">
                {/* Selection is conveyed by the badge state as well as the border,
                    so it does not rely on colour alone. */}
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center border-2 ${
                    isSelected
                      ? "bg-blue-500 border-blue-500"
                      : "bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  }`}
                >
                  {isSelected ? (
                    <Check size={16} color="#FFFFFF" strokeWidth={3} />
                  ) : (
                    <Text className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      {label}
                    </Text>
                  )}
                </View>
                <Text
                  className={`flex-1 text-lg leading-relaxed ${
                    isSelected
                      ? "text-blue-900 dark:text-blue-100 font-semibold"
                      : "text-gray-900 dark:text-gray-50"
                  }`}
                >
                  {option.content}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
