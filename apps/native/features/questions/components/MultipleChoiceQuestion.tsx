import { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import type { MultipleChoiceQuestionProps } from "../types";

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
    if (disabled) return;

    if (allowMultiple) {
      // Multiple selection
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      // Single selection
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.length === 0) return;

    const answer = allowMultiple ? selectedOptions : selectedOptions[0];
    onSubmit(answer);
  };

  const isOptionSelected = (optionId: number) => selectedOptions.includes(optionId);
  const hasSelection = selectedOptions.length > 0;

  // Sort options by sequence
  const sortedOptions = [...(question.options || [])].sort(
    (a, b) => a.sequence - b.sequence
  );

  return (
    <View>
      {/* Question Text */}
      <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
        <Text className="text-sm text-primary font-semibold mb-2">
          QUESTÃO
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

        {/* Multiple selection hint */}
        {allowMultiple && (
          <Text className="text-xs text-gray-500 mt-3 italic">
            Selecione todas as opções corretas
          </Text>
        )}
      </View>

      {/* Options */}
      <View className="mb-6">
        {sortedOptions.map((option, index) => {
          const isSelected = isOptionSelected(option.id);
          const optionLabel = option.label || String.fromCharCode(65 + index); // A, B, C, D...

          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => handleOptionPress(option.id)}
              disabled={disabled}
              className={`bg-white rounded-xl p-4 mb-3 border-2 ${
                isSelected ? "border-primary" : "border-gray-200"
              } ${disabled ? "opacity-50" : ""}`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-start gap-3">
                {/* Option Letter/Label */}
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isSelected ? "bg-primary" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      isSelected ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {optionLabel}
                  </Text>
                </View>

                {/* Option Text */}
                <Text
                  className={`flex-1 text-base leading-relaxed ${
                    isSelected
                      ? "text-primary font-semibold"
                      : "text-gray-900"
                  }`}
                >
                  {option.optionText}
                </Text>

                {/* Selection Indicator for Multiple Choice */}
                {allowMultiple && (
                  <View
                    className={`w-6 h-6 rounded border-2 items-center justify-center ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <Text className="text-white text-xs font-bold">✓</Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
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
