import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { CheckCircle2, XCircle } from "lucide-react-native";
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

  // Assume first option is "True" and second is "False" based on backend convention
  // Or use the optionText to determine
  const trueOption = question.options?.find(
    (opt) =>
      opt.optionText.toLowerCase().includes("verdadeiro") ||
      opt.optionText.toLowerCase().includes("true") ||
      opt.optionText.toLowerCase().includes("sim")
  );

  const falseOption = question.options?.find(
    (opt) =>
      opt.optionText.toLowerCase().includes("falso") ||
      opt.optionText.toLowerCase().includes("false") ||
      opt.optionText.toLowerCase().includes("não")
  );

  // Fallback to sequence if text matching fails
  const options = {
    true: trueOption || question.options?.[0],
    false: falseOption || question.options?.[1],
  };

  const handleOptionPress = (optionId: number) => {
    if (disabled) return;
    setSelectedOption(optionId);
  };

  const handleSubmit = () => {
    if (selectedOption === null) return;
    onSubmit(selectedOption);
  };

  const hasSelection = selectedOption !== null;

  return (
    <View>
      {/* Question Text */}
      <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
        <Text className="text-sm text-primary font-semibold mb-2">
          VERDADEIRO OU FALSO
        </Text>
        <Text className="text-lg text-gray-900 leading-relaxed mb-2">
          {question.prompt || question.questionText}
        </Text>

        {/* Question Image */}
        {question.imageUrl && (
          <Image
            source={{ uri: question.imageUrl }}
            className="w-full h-48 rounded-lg mt-4"
            resizeMode="cover"
          />
        )}
      </View>

      {/* True/False Options */}
      <View className="mb-6 gap-4">
        {/* True Option */}
        {options.true && (
          <TouchableOpacity
            onPress={() => handleOptionPress(options.true.id)}
            disabled={disabled}
            className={`bg-white rounded-xl p-6 border-2 ${
              selectedOption === options.true.id
                ? "border-green-500 bg-green-50"
                : "border-gray-200"
            } ${disabled ? "opacity-50" : ""}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  selectedOption === options.true.id
                    ? "bg-green-500"
                    : "bg-green-100"
                }`}
              >
                <CheckCircle2
                  size={28}
                  color={
                    selectedOption === options.true.id ? "#FFFFFF" : "#10B981"
                  }
                  strokeWidth={2.5}
                />
              </View>
              <Text
                className={`text-xl font-semibold ${
                  selectedOption === options.true.id
                    ? "text-green-700"
                    : "text-gray-900"
                }`}
              >
                Verdadeiro
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* False Option */}
        {options.false && (
          <TouchableOpacity
            onPress={() => handleOptionPress(options.false.id)}
            disabled={disabled}
            className={`bg-white rounded-xl p-6 border-2 ${
              selectedOption === options.false.id
                ? "border-red-500 bg-red-50"
                : "border-gray-200"
            } ${disabled ? "opacity-50" : ""}`}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center gap-4">
              <View
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  selectedOption === options.false.id
                    ? "bg-red-500"
                    : "bg-red-100"
                }`}
              >
                <XCircle
                  size={28}
                  color={
                    selectedOption === options.false.id ? "#FFFFFF" : "#EF4444"
                  }
                  strokeWidth={2.5}
                />
              </View>
              <Text
                className={`text-xl font-semibold ${
                  selectedOption === options.false.id
                    ? "text-red-700"
                    : "text-gray-900"
                }`}
              >
                Falso
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!hasSelection || isSubmitting || disabled}
        className={`rounded-full py-4 items-center ${
          !hasSelection || isSubmitting || disabled
            ? "bg-gray-300"
            : "bg-primary"
        }`}
        activeOpacity={0.8}
      >
        <Text className="text-white text-base font-semibold">
          {isSubmitting ? "Enviando..." : "Enviar Resposta"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
