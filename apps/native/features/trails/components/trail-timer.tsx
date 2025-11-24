import { View, Text } from "react-native";
import { useEffect, useState } from "react";

interface TrailTimerProps {
  timeLimitMinutes: number;
  startedAt: string | null;
  onExpired?: () => void;
}

export function TrailTimer({ timeLimitMinutes, startedAt, onExpired }: TrailTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!startedAt || !timeLimitMinutes) {
      setRemainingSeconds(null);
      return;
    }

    const calculateRemaining = () => {
      const start = new Date(startedAt).getTime();
      const now = Date.now();
      const elapsed = (now - start) / 1000; // seconds
      const total = timeLimitMinutes * 60; // convert to seconds
      const remaining = Math.max(0, total - elapsed);

      setRemainingSeconds(Math.floor(remaining));

      if (remaining <= 0 && onExpired) {
        onExpired();
      }
    };

    // Calculate immediately
    calculateRemaining();

    // Update every second
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [startedAt, timeLimitMinutes, onExpired]);

  if (remainingSeconds === null) {
    return null;
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isLowTime = remainingSeconds < 300; // Less than 5 minutes
  const isVeryLowTime = remainingSeconds < 60; // Less than 1 minute

  return (
    <View
      className={`px-3 py-1.5 rounded-lg ${
        isVeryLowTime
          ? "bg-red-50 dark:bg-red-900/30"
          : isLowTime
            ? "bg-orange-50 dark:bg-orange-900/30"
            : "bg-blue-50 dark:bg-blue-900/30"
      }`}
    >
      <Text
        className={`text-xs font-semibold ${
          isVeryLowTime
            ? "text-red-700 dark:text-red-200"
            : isLowTime
              ? "text-orange-700 dark:text-orange-200"
              : "text-blue-700 dark:text-blue-200"
        }`}
      >
        ⏱️ {minutes}:{seconds.toString().padStart(2, "0")}
      </Text>
    </View>
  );
}
