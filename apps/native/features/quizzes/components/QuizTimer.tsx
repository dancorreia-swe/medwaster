import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Clock, AlertCircle } from "lucide-react-native";
import type { QuizTimerProps } from "../types";

/**
 * Quiz Timer Component
 * Counts down from time limit and alerts when time is up
 */
export function QuizTimer({ timeLimit, startTime, onTimeUp }: QuizTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const totalSeconds = timeLimit * 60;
    return Math.max(0, totalSeconds - elapsed);
  });

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onTimeUp]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isLowTime = secondsRemaining <= 60; // Last minute
  const isCritical = secondsRemaining <= 30; // Last 30 seconds

  return (
    <View
      className={`rounded-xl p-4 mb-4 border ${
        isCritical
          ? "bg-red-50 border-red-300"
          : isLowTime
            ? "bg-orange-50 border-orange-300"
            : "bg-blue-50 border-blue-300"
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {isCritical ? (
            <AlertCircle size={20} color="#EF4444" strokeWidth={2.5} />
          ) : (
            <Clock
              size={20}
              color={isLowTime ? "#F97316" : "#155DFC"}
              strokeWidth={2.5}
            />
          )}
          <Text
            className={`text-sm font-semibold ${
              isCritical
                ? "text-red-700"
                : isLowTime
                  ? "text-orange-700"
                  : "text-blue-700"
            }`}
          >
            Tempo Restante
          </Text>
        </View>

        <Text
          className={`text-2xl font-bold ${
            isCritical
              ? "text-red-600"
              : isLowTime
                ? "text-orange-600"
                : "text-blue-600"
          }`}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </Text>
      </View>

      {isLowTime && (
        <Text
          className={`text-xs mt-2 ${
            isCritical ? "text-red-600" : "text-orange-600"
          }`}
        >
          {isCritical ? "⚠️ Últimos segundos!" : "⏰ Quase acabando!"}
        </Text>
      )}
    </View>
  );
}
