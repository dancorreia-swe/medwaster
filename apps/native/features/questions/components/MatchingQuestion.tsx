import { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Link2, Minus } from "lucide-react-native";
import type { MatchingQuestionProps } from "../types";

/**
 * Matching Pairs Question Component
 * Users tap left items, then tap right items to create matches
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
    if (disabled) return;

    if (selectedLeft === leftId) {
      // Deselect if already selected
      setSelectedLeft(null);
    } else {
      // Select this left item
      setSelectedLeft(leftId);
    }
  };

  const handleRightItemPress = (rightId: number) => {
    if (disabled || selectedLeft === null) return;

    // Create or update match
    setMatches((prev) => ({
      ...prev,
      [selectedLeft.toString()]: rightId.toString(),
    }));

    // Deselect after matching
    setSelectedLeft(null);
  };

  const handleRemoveMatch = (leftId: number) => {
    if (disabled) return;

    setMatches((prev) => {
      const newMatches = { ...prev };
      delete newMatches[leftId.toString()];
      return newMatches;
    });
  };

  const handleSubmit = () => {
    if (Object.keys(matches).length !== sortedPairs.length) return;
    onSubmit(matches);
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

  return (
    <View>
      {/* Question Text */}
      <View className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
        <Text className="text-sm text-primary font-semibold mb-2">
          RELACIONE AS COLUNAS
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
          Toque em um item da esquerda, depois toque no item correspondente da
          direita
        </Text>
      </View>

      {/* Matching Interface */}
      <View className="mb-6">
        <View className="flex-row gap-3">
          {/* Left Column */}
          <View className="flex-1">
            <Text className="text-xs font-semibold text-gray-600 mb-3 uppercase">
              Coluna A
            </Text>
            {sortedPairs.map((pair, index) => {
              const isMatched = isLeftItemMatched(pair.id);
              const isSelected = selectedLeft === pair.id;
              const matchedRightId = matches[pair.id.toString()];

              return (
                <View key={pair.id} className="mb-3">
                  <TouchableOpacity
                    onPress={() => handleLeftItemPress(pair.id)}
                    disabled={disabled}
                    className={`rounded-xl p-4 border-2 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : isMatched
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white"
                    } ${disabled ? "opacity-50" : ""}`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs font-bold text-gray-500">
                        {index + 1}
                      </Text>
                      <Text
                        className={`flex-1 text-sm ${
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
                    <View className="mt-2 ml-4 flex-row items-center gap-2">
                      <Link2 size={14} color="#10B981" />
                      <Text
                        className="flex-1 text-xs text-green-700"
                        numberOfLines={2}
                      >
                        {getRightTextForMatch(matchedRightId)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveMatch(pair.id)}
                        className="p-1"
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
            <Text className="text-xs font-semibold text-gray-600 mb-3 uppercase">
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
                  className={`rounded-xl p-4 border-2 mb-3 ${
                    isMatched
                      ? "border-green-500 bg-green-50 opacity-50"
                      : canSelect
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-white"
                  } ${disabled ? "opacity-50" : ""}`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-2">
                    <Text className="text-xs font-bold text-gray-500">
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text
                      className={`flex-1 text-sm ${
                        isMatched
                          ? "text-green-700 font-semibold"
                          : canSelect
                            ? "text-primary font-medium"
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

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!allMatched || isSubmitting || disabled}
        className={`rounded-full py-4 items-center ${
          !allMatched || isSubmitting || disabled
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
