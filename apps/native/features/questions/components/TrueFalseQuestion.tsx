import { useState, useEffect, useMemo } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Check, X } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { TrueFalseQuestionProps } from "../types";
import { HtmlText } from "@/components/HtmlText";
import { resolveTrueFalseOptions } from "../utils";

/**
 * True/False Question Component
 * Optimized UI for binary choice questions
 */
export function TrueFalseQuestion({
  question,
  onSubmit,
  isSubmitting = false,
  disabled = false,
}: TrueFalseQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const { trueOption, falseOption } = useMemo(
    () => resolveTrueFalseOptions(question.options),
    [question.options],
  );

  const handleOptionPress = (optionId: number) => {
    if (disabled || isSubmitting) return;

    setSelectedOption(optionId);
  };

  // Notify parent of answer changes
  useEffect(() => {
    if (selectedOption !== null) {
      onSubmit(selectedOption);
    }
  }, [selectedOption, onSubmit]);

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

      {/* Options — mirrors the admin editor's side-by-side Verdadeiro / Falso
          choice, with selection shown by fill + ring rather than colour alone. */}
      <View
        className="flex-row gap-4"
        accessibilityRole="radiogroup"
        accessibilityLabel="Verdadeiro ou falso"
      >
        {trueOption && (
          <TouchableOpacity
            onPress={() => handleOptionPress(trueOption.id)}
            disabled={disabled || isSubmitting}
            accessibilityRole="radio"
            accessibilityState={{
              checked: selectedOption === trueOption.id,
              disabled: disabled || isSubmitting,
            }}
            accessibilityLabel={trueOption.content || "Verdadeiro"}
            className={`flex-1 rounded-3xl py-8 px-4 items-center justify-center border-2 ${
              selectedOption === trueOption.id
                ? "border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/30"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            } ${disabled || isSubmitting ? "opacity-50" : ""}`}
            activeOpacity={0.7}
          >
            <View
              className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
                selectedOption === trueOption.id
                  ? "bg-green-500"
                  : "bg-green-100 dark:bg-green-900/40"
              }`}
            >
              <Check
                size={28}
                color={selectedOption === trueOption.id ? "#FFFFFF" : "#10B981"}
                strokeWidth={3}
              />
            </View>
            <Text
              className={`text-lg text-center ${
                selectedOption === trueOption.id
                  ? "text-green-800 dark:text-green-100 font-bold"
                  : "text-gray-900 dark:text-gray-50 font-semibold"
              }`}
            >
              {trueOption.content || "Verdadeiro"}
            </Text>
          </TouchableOpacity>
        )}

        {/* False Option */}
        {falseOption && (
          <TouchableOpacity
            onPress={() => handleOptionPress(falseOption.id)}
            disabled={disabled || isSubmitting}
            accessibilityRole="radio"
            accessibilityState={{
              checked: selectedOption === falseOption.id,
              disabled: disabled || isSubmitting,
            }}
            accessibilityLabel={falseOption.content || "Falso"}
            className={`flex-1 rounded-3xl py-8 px-4 items-center justify-center border-2 ${
              selectedOption === falseOption.id
                ? "border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/30"
                : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
            } ${disabled || isSubmitting ? "opacity-50" : ""}`}
            activeOpacity={0.7}
          >
            <View
              className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${
                selectedOption === falseOption.id
                  ? "bg-red-500"
                  : "bg-red-100 dark:bg-red-900/40"
              }`}
            >
              <X
                size={28}
                color={selectedOption === falseOption.id ? "#FFFFFF" : "#EF4444"}
                strokeWidth={3}
              />
            </View>
            <Text
              className={`text-lg text-center ${
                selectedOption === falseOption.id
                  ? "text-red-800 dark:text-red-100 font-bold"
                  : "text-gray-900 dark:text-gray-50 font-semibold"
              }`}
            >
              {falseOption.content || "Falso"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
