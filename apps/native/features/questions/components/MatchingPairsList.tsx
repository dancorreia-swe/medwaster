import { View, Text } from "react-native";

type MatchingPairDisplay = {
  id: string;
  left: string;
  right: string;
};

type Tone = "neutral" | "info" | "success";

const toneStyles: Record<Tone, { container: string; text: string; arrow: string }> = {
  neutral: {
    container: "bg-white border-gray-200",
    text: "text-gray-900",
    arrow: "text-gray-400",
  },
  info: {
    container: "bg-blue-50 border-blue-200",
    text: "text-blue-900",
    arrow: "text-blue-500",
  },
  success: {
    container: "bg-green-50 border-green-200",
    text: "text-green-900",
    arrow: "text-green-600",
  },
};

interface MatchingPairsListProps {
  pairs: MatchingPairDisplay[];
  tone?: Tone;
  emptyLabel?: string;
}

export function MatchingPairsList({
  pairs,
  tone = "neutral",
  emptyLabel = "Nenhuma correspondência",
}: MatchingPairsListProps) {
  if (!pairs.length) {
    return (
      <Text className="text-sm text-gray-500" testID="matching-empty-state">
        {emptyLabel}
      </Text>
    );
  }

  const toneClass = toneStyles[tone];

  return (
    <View className="gap-2">
      {pairs.map((pair) => (
        <View
          key={pair.id}
          className={`flex-row items-center gap-3 rounded-2xl px-4 py-3 border ${toneClass.container}`}
        >
          <Text className={`flex-1 text-sm font-semibold ${toneClass.text}`}>
            {pair.left}
          </Text>
          <Text className={`text-lg font-extrabold ${toneClass.arrow}`}>→</Text>
          <Text className={`flex-1 text-sm ${toneClass.text}`}>{pair.right}</Text>
        </View>
      ))}
    </View>
  );
}
