import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Image } from "react-native";
import type { FillInBlankQuestionProps } from "../types";

/**
 * Fill in the Blank Question Component
 * Supports multiple blanks with text input or multiple choice options
 */
export function FillInBlankQuestion({
  question,
  onSubmit,
  isSubmitting = false,
  disabled = false,
}: FillInBlankQuestionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Sort blanks by sequence
  const sortedBlanks = [...(question.fillInBlanks || [])].sort(
    (a, b) => a.sequence - b.sequence
  );

  const handleTextChange = (blankId: number, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [blankId.toString()]: text.trim(),
    }));
  };

  const handleOptionSelect = (blankId: number, optionText: string) => {
    setAnswers((prev) => ({
      ...prev,
      [blankId.toString()]: optionText,
    }));
  };

  const handleSubmit = () => {
    // Check if all blanks are filled
    const allFilled = sortedBlanks.every((blank) => {
      const answer = answers[blank.id.toString()];
      return answer && answer.length > 0;
    });

    if (!allFilled) return;

    onSubmit(answers);
  };

  const allBlanksFilled = sortedBlanks.every((blank) => {
    const answer = answers[blank.id.toString()];
    return answer && answer.length > 0;
  });

  return (
    <View>
      {/* Question Text */}
      <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
        <Text className="text-sm text-primary font-semibold mb-2">
          PREENCHA OS ESPAÇOS
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

        <Text className="text-xs text-gray-500 mt-3 italic">
          Preencha cada campo abaixo
        </Text>
      </View>

      {/* Blanks */}
      <View className="mb-6">
        {sortedBlanks.map((blank, index) => {
          const currentAnswer = answers[blank.id.toString()] || "";
          const hasOptions = blank.options && blank.options.length > 0;

          return (
            <View key={blank.id} className="mb-5">
              {/* Blank Label */}
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Espaço {index + 1}: {blank.placeholder}
              </Text>

              {hasOptions ? (
                // Multiple choice options for this blank
                <View className="gap-2">
                  {blank.options
                    ?.sort((a, b) => a.sequence - b.sequence)
                    .map((option) => {
                      const isSelected = currentAnswer === option.optionText;

                      return (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() =>
                            handleOptionSelect(blank.id, option.optionText)
                          }
                          disabled={disabled}
                          className={`bg-white rounded-xl p-4 border-2 ${
                            isSelected ? "border-primary" : "border-gray-200"
                          } ${disabled ? "opacity-50" : ""}`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-base ${
                              isSelected
                                ? "text-primary font-semibold"
                                : "text-gray-900"
                            }`}
                          >
                            {option.optionText}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              ) : (
                // Text input for this blank
                <TextInput
                  value={currentAnswer}
                  onChangeText={(text) => handleTextChange(blank.id, text)}
                  placeholder={`Digite sua resposta...`}
                  editable={!disabled}
                  className={`bg-white rounded-xl p-4 border-2 text-base text-gray-900 ${
                    currentAnswer.length > 0
                      ? "border-primary"
                      : "border-gray-200"
                  } ${disabled ? "opacity-50" : ""}`}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            </View>
          );
        })}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!allBlanksFilled || isSubmitting || disabled}
        className={`rounded-full py-4 items-center ${
          !allBlanksFilled || isSubmitting || disabled
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
