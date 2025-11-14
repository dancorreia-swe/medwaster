import { useState } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Link2, Minus } from "lucide-react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { MatchingQuestionProps } from "../types";

/**
 * Matching Pairs Question Component
 * Users tap left items, then tap right items to create matches with confirm button
 */
export function MatchingQuestion({
  question,
  onSubmit,
  isSubmitting = false,
  disabled = false,
}: MatchingQuestionProps) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);

  // Sort pairs by sequence
  const sortedPairs = [...(question.matchingPairs || [])].sort(
    (a, b) => a.sequence - b.sequence
  );

  // Shuffle right items for display (to make it challenging)
  const [rightItems] = useState(() => {
    const items = sortedPairs.map((pair) => ({
      id: pair.id,
      text: pair.rightText,
    }));
    // Shuffle array
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  });

  const handleLeftItemPress = (leftId: number) => {
    if (disabled || isSubmitting) return;

    if (selectedLeft === leftId) {
      // Deselect if already selected
      setSelectedLeft(null);
    } else {
      // Select this left item
      setSelectedLeft(leftId);
    }
  };

  const handleRightItemPress = (rightId: number) => {
    if (disabled || isSubmitting || selectedLeft === null) return;

    // Create or update match
    setMatches((prev) => ({
      ...prev,
      [selectedLeft.toString()]: rightId.toString(),
    }));

    // Deselect after matching
    setSelectedLeft(null);
  };

  const handleRemoveMatch = (leftId: number) => {
    if (disabled || isSubmitting) return;

    setMatches((prev) => {
      const newMatches = { ...prev };
      delete newMatches[leftId.toString()];
      return newMatches;
    });
  };

  const isLeftItemMatched = (leftId: number) => {
    return leftId.toString() in matches;
  };

  const isRightItemMatched = (rightId: number) => {
    return Object.values(matches).includes(rightId.toString());
  };

  const getRightTextForMatch = (rightId: string) => {
    const item = rightItems.find((item) => item.id.toString() === rightId);
    return item?.text || "";
  };

  const allMatched = Object.keys(matches).length === sortedPairs.length;

  const handleConfirm = () => {
    if (!allMatched || disabled || isSubmitting) return;

    onSubmit(matches);
  };

  return (
    <Animated.View entering={FadeIn.duration(400)}>
      {/* Question Text */}
      <View className="bg-white rounded-3xl p-6 mb-6 shadow-sm">
        <View className="mb-3 bg-pink-50 self-start px-3 py-1 rounded-full">
          <Text className="text-xs text-pink-700 font-bold tracking-wide">
            RELACIONE AS COLUNAS
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
            💡 Toque em um item da esquerda, depois toque no correspondente da direita
          </Text>
        </View>
      </View>

      {/* Matching Interface */}
      <View className="mb-4">
        <View className="flex-row gap-4">
          {/* Left Column */}
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-wide">
              Coluna A
            </Text>
            {sortedPairs.map((pair, index) => {
              const isMatched = isLeftItemMatched(pair.id);
              const isSelected = selectedLeft === pair.id;
              const matchedRightId = matches[pair.id.toString()];

              return (
                <View key={pair.id} className="mb-4">
                  <TouchableOpacity
                    onPress={() => handleLeftItemPress(pair.id)}
                    disabled={disabled}
                    className={`rounded-3xl p-5 border-2 shadow-sm ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : isMatched
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white"
                    } ${disabled ? "opacity-50" : ""}`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-7 h-7 rounded-full items-center justify-center ${
                        isSelected || isMatched ? "bg-primary" : "bg-gray-100"
                      }`}>
                        <Text className={`text-xs font-bold ${
                          isSelected || isMatched ? "text-white" : "text-gray-600"
                        }`}>
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        className={`flex-1 text-base leading-relaxed ${
                          isSelected || isMatched
                            ? "text-gray-900 font-semibold"
                            : "text-gray-700"
                        }`}
                        numberOfLines={3}
                      >
                        {pair.leftText}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Show matched right item */}
                  {isMatched && matchedRightId && (
                    <View className="mt-3 ml-2 flex-row items-center gap-2 bg-green-50 rounded-xl p-3 border border-green-200">
                      <Link2 size={16} color="#10B981" strokeWidth={2.5} />
                      <Text
                        className="flex-1 text-sm text-green-700 font-medium"
                        numberOfLines={2}
                      >
                        {getRightTextForMatch(matchedRightId)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveMatch(pair.id)}
                        className="p-1.5 bg-red-50 rounded-full"
                      >
                        <Minus size={16} color="#EF4444" strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Right Column */}
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-wide">
              Coluna B
            </Text>
            {rightItems.map((item, index) => {
              const isMatched = isRightItemMatched(item.id);
              const canSelect = selectedLeft !== null && !isMatched;

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleRightItemPress(item.id)}
                  disabled={disabled || !canSelect}
                  className={`rounded-3xl p-5 border-2 mb-4 shadow-sm ${
                    isMatched
                      ? "border-green-500 bg-green-50 opacity-50"
                      : canSelect
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 bg-white"
                  } ${disabled ? "opacity-50" : ""}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-3">
                    <View className={`w-7 h-7 rounded-full items-center justify-center ${
                      isMatched
                        ? "bg-green-500"
                        : canSelect
                          ? "bg-primary"
                          : "bg-gray-100"
                    }`}>
                      <Text className={`text-xs font-bold ${
                        isMatched || canSelect ? "text-white" : "text-gray-600"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text
                      className={`flex-1 text-base leading-relaxed ${
                        isMatched
                          ? "text-green-700 font-semibold"
                          : canSelect
                            ? "text-primary font-semibold"
                            : "text-gray-700"
                      }`}
                      numberOfLines={3}
                    >
                      {item.text}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Confirm Button */}
      {allMatched && (
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
