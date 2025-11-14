import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Image, ActivityIndicator } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { FillInBlankQuestionProps } from "../types";

/**
 * Fill in the Blank Question Component
 * Supports multiple blanks with text input or multiple choice options with confirm button
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
    (a, b) => a.sequence - b.sequence,
  );

  const allBlanksFilled = sortedBlanks.every((blank) => {
    const answer = answers[blank.id.toString()];
    return answer && answer.length > 0;
  });

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

  const handleConfirm = () => {
    if (!allBlanksFilled || disabled || isSubmitting) return;

    onSubmit(answers);
  };

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Question Text */}
      <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
        <View className="mb-3 bg-amber-50 self-start px-3 py-1 rounded-full">
          <Text className="text-xs text-amber-700 font-bold tracking-wide">
            PREENCHA OS ESPAÇOS
          </Text>
        </View>
        <Text className="text-2xl text-gray-900 font-bold leading-relaxed">
          {question.prompt || question.questionText}
        </Text>

        {/* Question Image */}
        {question.imageUrl && (
          <Image
            source={{ uri: question.imageUrl }}
            className="w-full h-52 rounded-2xl mt-5"
            resizeMode="cover"
          />
        )}

        <View className="mt-4 bg-blue-50 rounded-xl p-3">
          <Text className="text-sm text-blue-700 font-medium text-center">
            💡 Preencha cada campo abaixo
          </Text>
        </View>
      </View>

      {/* Blanks */}
      <View className="mb-4 gap-5">
        {sortedBlanks.map((blank, index) => {
          const currentAnswer = answers[blank.id.toString()] || "";
          const hasOptions = blank.options && blank.options.length > 0;

          return (
            <View key={blank.id}>
              {/* Blank Label */}
              <Text className="text-base font-bold text-gray-900 mb-3">
                Espaço {index + 1}: {blank.placeholder}
              </Text>

              {hasOptions ? (
                // Multiple choice options for this blank
                <View className="gap-3">
                  {blank.options
                    ?.sort((a, b) => a.sequence - b.sequence)
                    .map((option) => {
                      const optionText =
                        (option as any).content || option.optionText || "";
                      const isSelected = currentAnswer === optionText;

                      return (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() =>
                            handleOptionSelect(blank.id, optionText)
                          }
                          disabled={disabled}
                          className={`bg-white rounded-2xl p-5 border-2 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-md"
                              : "border-gray-200"
                          } ${disabled ? "opacity-50" : ""}`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-lg leading-relaxed ${
                              isSelected
                                ? "text-primary font-semibold"
                                : "text-gray-900"
                            }`}
                          >
                            {optionText}
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
                  className={`bg-white rounded-3xl p-5 border-2 text-lg text-gray-900 shadow-sm ${
                    currentAnswer.length > 0
                      ? "border-primary bg-primary/5"
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

      {/* Confirm Button */}
      {allBlanksFilled && (
        <Animated.View entering={FadeIn.duration(300)}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={disabled || isSubmitting}
            className={`bg-purple-600 rounded-2xl p-5 shadow-lg ${
              disabled || isSubmitting ? "opacity-50" : ""
            }`}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="white" className="mr-2" />
                  <Text className="text-white text-lg font-bold">
                    Enviando...
                  </Text>
                </>
              ) : (
                <Text className="text-white text-lg font-bold">
                  Confirmar Resposta
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}
