import { useState, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Modal, ScrollView, Pressable } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { FillInBlankQuestionProps } from "../types";
import { X } from "lucide-react-native";
import { HtmlText } from "@/components/HtmlText";

// Simple HTML stripper for parsing blanks
const stripHtml = (html: string): string => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
};

/**
 * Fill in the Blank Question Component
 * Shows blanks inline in the question text with clickable underscores
 */
export function FillInBlankQuestion({
  question,
  onSubmit,
  isSubmitting = false,
  disabled = false,
}: FillInBlankQuestionProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Sort blanks by sequence
  const sortedBlanks = useMemo(
    () => [...(question.fillInBlanks || [])].sort((a, b) => a.sequence - b.sequence),
    [question.fillInBlanks]
  );

  const allBlanksFilled = sortedBlanks.every((blank) => {
    const answer = answers[blank.id.toString()];
    return answer && answer.length > 0;
  });

  const currentBlank = sortedBlanks.find((b) => b.id === selectedBlank);

  // Notify parent of answer changes when all blanks are filled
  useEffect(() => {
    if (allBlanksFilled) {
      console.log("[FillInBlank] Submitting answers:", answers);
      onSubmit(answers);
    }
  }, [answers, allBlanksFilled, onSubmit]);

  const handleBlankPress = (blankId: number) => {
    if (disabled) return;
    setSelectedBlank(blankId);
    setIsModalVisible(true);
  };

  const handleOptionSelect = (blankId: number, optionText: string) => {
    setAnswers((prev) => ({
      ...prev,
      [blankId.toString()]: optionText,
    }));
    setIsModalVisible(false);
    setSelectedBlank(null);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    // Delay clearing selectedBlank to prevent content from disappearing during fade animation
    setTimeout(() => {
      setSelectedBlank(null);
    }, 300);
  };

  // Parse question text and replace {{1}}, {{2}}, etc with interactive blanks
  const renderQuestionWithBlanks = () => {
    let text = stripHtml(question.prompt || question.questionText);
    const parts: Array<{
      type: "text" | "blank";
      content: string;
      blankIndex?: number;
    }> = [];

    // Split by {{number}} pattern
    const regex = /\{\{(\d+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index),
        });
      }

      // Add the blank
      const blankNumber = parseInt(match[1], 10);
      parts.push({
        type: "blank",
        content: "",
        blankIndex: blankNumber - 1, // Convert to 0-based index
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex),
      });
    }

    return (
      <View className="flex-row flex-wrap items-center">
        {parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <Text
                key={`text-${index}`}
                className="text-lg text-gray-900 dark:text-gray-50 leading-relaxed"
              >
                {part.content}
              </Text>
            );
          } else {
            const blank = sortedBlanks[part.blankIndex!];
            if (!blank) return null;

            const answer = answers[blank.id.toString()];

            return (
              <TouchableOpacity
                key={`blank-${index}`}
                onPress={() => handleBlankPress(blank.id)}
                disabled={disabled}
                className={`px-3 py-1.5 mx-1 my-1 rounded-lg border-b-2 ${
                  answer
                    ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400"
                    : "bg-gray-100 border-gray-400 border-dashed dark:bg-gray-800 dark:border-gray-600"
                }`}
                style={{ minWidth: 100 }}
              >
                <Text
                  className={`text-lg text-center ${
                    answer
                      ? "text-blue-700 dark:text-blue-200 font-semibold"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {answer || "_____"}
                </Text>
              </TouchableOpacity>
            );
          }
        })}
      </View>
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Question Card */}
      <View className="bg-white dark:bg-gray-900 rounded-3xl p-6 mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <View className="mb-4 bg-amber-50 dark:bg-amber-900/30 self-start px-3 py-1.5 rounded-full">
          <Text className="text-xs text-amber-700 dark:text-amber-200 font-bold tracking-wide">
            PREENCHA OS ESPAÇOS
          </Text>
        </View>

        {/* Question Text with Interactive Blanks */}
        <View className="mb-4">{renderQuestionWithBlanks()}</View>

        {/* Question Image */}
        {question.imageUrl && (
          <Image
            source={{ uri: question.imageUrl }}
            className="w-full h-52 rounded-2xl mt-4"
            resizeMode="cover"
          />
        )}

        <View className="mt-5 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3.5">
          <Text className="text-sm text-blue-700 dark:text-blue-200 font-medium text-center">
            💡 Toque nos espaços em branco para selecionar as respostas
          </Text>
        </View>
      </View>

      {/* Modal for selecting options */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleModalClose}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <Pressable 
            onPress={handleModalClose}
            className="absolute inset-0"
          />
          <View className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-xl border border-gray-100 dark:border-gray-800" style={{ maxHeight: '80%' }}>
            {/* Header */}
            <View className="px-6 pt-6 pb-4 flex-row items-center justify-between border-b border-gray-200 dark:border-gray-800">
              <Text className="text-lg font-bold text-gray-900 dark:text-gray-50 flex-1">
                Selecione a resposta
              </Text>
              <TouchableOpacity
                onPress={handleModalClose}
                className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center"
              >
                <X size={20} color={isModalVisible ? "#9CA3AF" : "#6B7280"} />
              </TouchableOpacity>
            </View>

            {/* Options List */}
            <ScrollView
              contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
              showsVerticalScrollIndicator={false}
            >
              {currentBlank &&
              Array.isArray(currentBlank.options) &&
              currentBlank.options.length > 0 ? (
                <View className="gap-3">
                  {[...currentBlank.options]
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((option) => {
                      const optionText =
                        (option as any).text ||
                        option.content ||
                        option.optionText ||
                        "";
                      const isSelected =
                        answers[currentBlank.id.toString()] === optionText;

                      return (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() =>
                            handleOptionSelect(currentBlank.id, optionText)
                          }
                          className={`rounded-2xl p-4 border-2 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                          }`}
                          activeOpacity={0.7}
                        >
                          <Text
                            className={`text-base text-center ${
                              isSelected
                                ? "text-blue-700 dark:text-blue-200 font-semibold"
                                : "text-gray-900 dark:text-gray-50"
                            }`}
                          >
                            {optionText}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              ) : (
                <View className="py-12">
                  <Text className="text-center text-gray-500 dark:text-gray-400 text-base">
                    Nenhuma opção disponível para este espaço
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}
