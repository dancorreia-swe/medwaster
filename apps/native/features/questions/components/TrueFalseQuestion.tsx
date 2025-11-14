import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Check, X } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { TrueFalseQuestionProps } from "../types";

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

  const trueOption = question.options?.find((opt) => {
    const text = ((opt as any).content || opt.optionText || "").toLowerCase();
    return (
      text.includes("verdadeiro") ||
      text.includes("true") ||
      text.includes("sim")
    );
  });

  const falseOption = question.options?.find((opt) => {
    const text = ((opt as any).content || opt.optionText || "").toLowerCase();
    return (
      text.includes("falso") || text.includes("false") || text.includes("não")
    );
  });

  const options = {
    true: trueOption || question.options?.[0],
    false: falseOption || question.options?.[1],
  };

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
      <Text className="text-3xl text-gray-900 font-bold mb-12">
        {question.prompt || question.questionText}
      </Text>

      {/* Options */}
      <View className="gap-4">
        {options.true && (
          <TouchableOpacity
            onPress={() => handleOptionPress(options.true.id)}
            disabled={disabled || isSubmitting}
            className={`bg-white rounded-2xl p-6 border-2 ${
              selectedOption === options.true.id
                ? "border-blue-500"
                : "border-gray-200"
            } ${disabled || isSubmitting ? "opacity-50" : ""}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <Check size={24} color="#10B981" strokeWidth={3} />
              <Text className="text-lg text-gray-900">
                Verdadeiro
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* False Option */}
        {options.false && (
          <TouchableOpacity
            onPress={() => handleOptionPress(options.false.id)}
            disabled={disabled || isSubmitting}
            className={`bg-white rounded-2xl p-6 border-2 ${
              selectedOption === options.false.id
                ? "border-blue-500"
                : "border-gray-200"
            } ${disabled || isSubmitting ? "opacity-50" : ""}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-3">
              <X size={24} color="#EF4444" strokeWidth={3} />
              <Text className="text-lg text-gray-900">
                Falso
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}
