import { useState, useCallback } from "react";
import * as Speech from "expo-speech";

export function useArticleAudio() {
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleAudioReading = useCallback(
    async (contentText: string, onComplete?: () => void) => {
      if (isReading) {
        await Speech.stop();
        setIsReading(false);
        setIsPaused(false);
      } else {
        const textToRead = contentText.replace(/\s+/g, " ").trim();
        setIsReading(true);
        setIsPaused(false);

        Speech.speak(textToRead, {
          language: "pt-BR",
          pitch: 1.0,
          rate: 0.9,
          onDone: () => {
            setIsReading(false);
            setIsPaused(false);
            onComplete?.();
          },
          onStopped: () => {
            setIsReading(false);
            setIsPaused(false);
          },
          onError: () => {
            setIsReading(false);
            setIsPaused(false);
          },
        });
      }
    },
    [isReading]
  );

  const handlePauseResume = useCallback(async () => {
    if (!isReading) return;

    if (isPaused) {
      await Speech.resume();
      setIsPaused(false);
    } else {
      await Speech.pause();
      setIsPaused(true);
    }
  }, [isReading, isPaused]);

  return {
    isReading,
    isPaused,
    handleAudioReading,
    handlePauseResume,
  };
}
