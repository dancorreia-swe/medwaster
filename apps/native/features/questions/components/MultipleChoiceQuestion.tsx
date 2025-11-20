import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
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

  // Sort options by sequence if available, otherwise by id
  const sortedOptions = [...(question.options || [])].sort((a, b) => {
    const aSeq = (a as any).sequence ?? a.id;
    const bSeq = (b as any).sequence ?? b.id;
    return aSeq - bSeq;
  });

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
      <View className="gap-4">
        {sortedOptions.map((option, index) => {
          const isSelected = isOptionSelected(option.id);

          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleOptionPress(option.id)}
              disabled={disabled || isSubmitting}
              className={`bg-white dark:bg-gray-900 rounded-2xl p-6 border-2 ${
                isSelected
                  ? "border-blue-500 dark:border-blue-400"
                  : "border-gray-200 dark:border-gray-800"
              } ${disabled || isSubmitting ? "opacity-50" : ""}`}
              activeOpacity={0.7}
            >
              <Text className="text-lg text-gray-900 dark:text-gray-50">
                {(option as any).content || option.optionText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}
