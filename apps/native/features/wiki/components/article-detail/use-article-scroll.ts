import { useRef, useCallback } from "react";
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from "react-native";

export function useArticleScroll(
  onReachEnd: (() => void) | undefined,
  canScroll: boolean,
  setHasReachedEnd: (value: boolean) => void,
  isReading: boolean = false
) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const fabTranslateY = useRef(new Animated.Value(0)).current;
  const pauseButtonScale = useRef(new Animated.Value(0)).current;
  const pauseButtonTranslateY = useRef(new Animated.Value(100)).current;
  const isAnimating = useRef(false);
  const contentHeight = useRef(0);
  const scrollViewHeight = useRef(0);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentScrollY = event.nativeEvent.contentOffset.y;
      const layoutHeight = event.nativeEvent.layoutMeasurement.height;
      const contentSizeHeight = event.nativeEvent.contentSize.height;

      contentHeight.current = contentSizeHeight;
      scrollViewHeight.current = layoutHeight;

      const isCloseToBottom =
        layoutHeight + currentScrollY >= contentSizeHeight - 50;

      if (isCloseToBottom && canScroll && onReachEnd) {
        setHasReachedEnd(true);
        onReachEnd();
      }

      const delta = currentScrollY - lastScrollY.current;
      const isScrollingDown = delta > 0;

      if (Math.abs(delta) > 5 && !isAnimating.current) {
        isAnimating.current = true;

        // Only animate pause button if audio is actually reading
        const animations = [
          Animated.timing(fabTranslateY, {
            toValue: isScrollingDown ? 150 : 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ];

        // Only include pause button animations if currently reading
        if (isReading) {
          animations.push(
            Animated.spring(pauseButtonScale, {
              toValue: isScrollingDown ? 0 : 1,
              useNativeDriver: true,
            }),
            Animated.spring(pauseButtonTranslateY, {
              toValue: isScrollingDown ? 100 : 0,
              useNativeDriver: true,
            })
          );
        }

        Animated.parallel(animations).start(() => {
          isAnimating.current = false;
        });
      }

      lastScrollY.current = currentScrollY;
    },
    [
      fabTranslateY,
      pauseButtonScale,
      pauseButtonTranslateY,
      canScroll,
      onReachEnd,
      setHasReachedEnd,
      isReading,
    ]
  );

  return {
    scrollY,
    fabTranslateY,
    pauseButtonScale,
    pauseButtonTranslateY,
    contentHeight,
    scrollViewHeight,
    handleScroll,
  };
}
