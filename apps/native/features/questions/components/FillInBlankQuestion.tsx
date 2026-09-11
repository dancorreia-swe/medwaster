import { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { FillInBlankQuestionProps } from "../types";
import { X } from "lucide-react-native";
import { HtmlText } from "@/components/HtmlText";
import { parsePromptSegments, sortFillBlankOptions } from "../utils";

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
  // Draft text for blanks the admin created without multiple-choice options.
  const [draftText, setDraftText] = useState("");

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
    setDraftText(answers[blankId.toString()] ?? "");
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

  const handleFreeTextConfirm = (blankId: number) => {
    const value = draftText.trim();
    if (!value) return;
    handleOptionSelect(blankId, value);
    setDraftText("");
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setDraftText("");
    // Delay clearing selectedBlank to prevent content from disappearing during fade animation
    setTimeout(() => {
      setSelectedBlank(null);
    }, 300);
  };

  const renderBlankChip = (blank: (typeof sortedBlanks)[number], key: string) => {
    const answer = answers[blank.id.toString()];
    const position = sortedBlanks.indexOf(blank) + 1;

    return (
      <TouchableOpacity
        key={key}
        onPress={() => handleBlankPress(blank.id)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        accessibilityLabel={
          answer
            ? `Espaço ${position}, resposta: ${answer}`
            : `Espaço ${position}, vazio`
        }
        accessibilityHint="Toque para responder este espaço"
        className={`px-3 mx-1 my-1 rounded-lg border-b-2 justify-center ${
          answer
            ? "bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-400"
            : "bg-gray-100 border-gray-400 border-dashed dark:bg-gray-800 dark:border-gray-600"
        }`}
        // 44pt minimum touch target.
        style={{ minWidth: 110, minHeight: 44 }}
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
  };

  // Render the authored prompt, keeping its inline formatting, with the {{n}}
  // markers replaced by tappable blanks.
  const renderQuestionWithBlanks = () => {
    const segments = parsePromptSegments(question.prompt || question.questionText);

    // An admin can save blanks without writing the matching {{n}} markers into
    // the prompt. Without this fallback the learner sees a sentence with nothing
    // tappable and cannot answer at all, so the blanks are listed explicitly.
    const hasBlankMarkers = segments.some((segment) => segment.type === "blank");

    const promptBody = (
      <View className="flex-row flex-wrap items-center">
        {segments.map((segment, index) => {
          if (segment.type === "break") {
            return <View key={`break-${index}`} style={{ width: "100%", height: 8 }} />;
          }

          if (segment.type === "text") {
            return (
              <Text
                key={`text-${index}`}
                className="text-lg text-gray-900 dark:text-gray-50 leading-relaxed"
                style={{
                  fontWeight: segment.bold ? "700" : "400",
                  fontStyle: segment.italic ? "italic" : "normal",
                  textDecorationLine: segment.underline
                    ? segment.strikethrough
                      ? "underline line-through"
                      : "underline"
                    : segment.strikethrough
                      ? "line-through"
                      : "none",
                }}
              >
                {segment.text}
              </Text>
            );
          }

          const blank = sortedBlanks[segment.blankIndex];
          if (!blank) return null;

          return renderBlankChip(blank, `blank-${index}`);
        })}
      </View>
    );

    if (hasBlankMarkers) {
      return promptBody;
    }

    return (
      <View>
        {promptBody}
        <View className="mt-4 gap-3">
          {sortedBlanks.map((blank, blankPosition) => {
            const answer = answers[blank.id.toString()];

            return (
              <TouchableOpacity
                key={blank.id}
                onPress={() => handleBlankPress(blank.id)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                accessibilityLabel={
                  answer
                    ? `Espaço ${blankPosition + 1}, resposta: ${answer}`
                    : `Espaço ${blankPosition + 1}, vazio`
                }
                accessibilityHint="Toque para responder este espaço"
                className={`flex-row items-center gap-3 rounded-2xl border-2 px-4 py-3 ${
                  answer
                    ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                    : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                }`}
                style={{ minHeight: 44 }}
              >
                <View className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center">
                  <Text className="text-xs font-bold text-amber-700 dark:text-amber-200">
                    {blankPosition + 1}
                  </Text>
                </View>
                <Text
                  className={`flex-1 text-base ${
                    answer
                      ? "text-blue-700 dark:text-blue-200 font-semibold"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {answer || blank.placeholder || "Toque para responder"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Question Card */}
      {/* Question Image — kept above the prompt so all four question types and
          the admin detail view place it in the same spot. */}
      {question.imageUrl && (
        <Image
          source={{ uri: question.imageUrl }}
          className="w-full h-64 rounded-2xl mb-8"
          resizeMode="cover"
        />
      )}

      <View className="bg-white dark:bg-gray-900 rounded-3xl p-6 mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <View className="mb-4 bg-amber-50 dark:bg-amber-900/30 self-start px-3 py-1.5 rounded-full">
          <Text className="text-xs text-amber-700 dark:text-amber-200 font-bold tracking-wide">
            PREENCHA OS ESPAÇOS
          </Text>
        </View>

        {/* Question Text with Interactive Blanks */}
        <View className="mb-4">{renderQuestionWithBlanks()}</View>

        <View className="mt-5 bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3.5">
          <Text className="text-sm text-blue-700 dark:text-blue-200 font-medium text-center">
            💡 Toque nos espaços em branco para responder
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
                {currentBlank?.options && currentBlank.options.length > 0
                  ? "Selecione a resposta"
                  : "Digite a resposta"}
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
                <View
                  className="gap-3"
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Opções para este espaço"
                >
                  {sortFillBlankOptions(currentBlank.options).map(
                    (option, optionIndex) => {
                      const optionText = option.text;
                      const isSelected =
                        answers[currentBlank.id.toString()] === optionText;
                      // The admin detail view letters each blank's options A, B,
                      // C…; the picker uses the same markers.
                      const label = String.fromCharCode(65 + optionIndex);

                      return (
                        <TouchableOpacity
                          key={option.id}
                          onPress={() =>
                            handleOptionSelect(currentBlank.id, optionText)
                          }
                          disabled={disabled}
                          accessibilityRole="radio"
                          accessibilityState={{
                            checked: isSelected,
                            disabled,
                          }}
                          accessibilityLabel={`Opção ${label}: ${optionText}`}
                          className={`rounded-2xl p-4 border-2 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30"
                              : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
                          }`}
                          style={{ minHeight: 44 }}
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-center gap-3">
                            <View
                              className={`w-7 h-7 rounded-full items-center justify-center ${
                                isSelected
                                  ? "bg-blue-500"
                                  : "bg-gray-100 dark:bg-gray-800"
                              }`}
                            >
                              <Text
                                className={`text-xs font-bold ${
                                  isSelected
                                    ? "text-white"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {label}
                              </Text>
                            </View>
                            <Text
                              className={`flex-1 text-base ${
                                isSelected
                                  ? "text-blue-700 dark:text-blue-200 font-semibold"
                                  : "text-gray-900 dark:text-gray-50"
                              }`}
                            >
                              {optionText}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    },
                  )}
                </View>
              ) : currentBlank ? (
                // Blanks may be created with only a canonical `answer` and no
                // options; those are answered by typing rather than picking.
                <View className="gap-4">
                  <TextInput
                    value={draftText}
                    onChangeText={setDraftText}
                    editable={!disabled}
                    autoFocus
                    placeholder={currentBlank.placeholder || "Digite sua resposta"}
                    placeholderTextColor="#9CA3AF"
                    onSubmitEditing={() => handleFreeTextConfirm(currentBlank.id)}
                    returnKeyType="done"
                    className="rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 text-base text-gray-900 dark:text-gray-50"
                  />
                  <TouchableOpacity
                    onPress={() => handleFreeTextConfirm(currentBlank.id)}
                    disabled={draftText.trim().length === 0}
                    className={`rounded-2xl py-4 items-center ${
                      draftText.trim().length === 0
                        ? "bg-gray-300 dark:bg-gray-700"
                        : "bg-blue-500"
                    }`}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-base font-semibold">
                      Confirmar
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}
