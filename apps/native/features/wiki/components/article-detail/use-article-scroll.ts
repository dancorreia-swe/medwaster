import { useRef, useCallback } from "react";
import { Animated, NativeSyntheticEvent, NativeScrollEvent } from "react-native";

export function useArticleScroll(
  onReachEnd: () => void,
  canScroll: boolean,
  setHasReachedEnd: (value: boolean) => void
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

      if (isCloseToBottom && canScroll) {
        setHasReachedEnd(true);
        onReachEnd();
      }

      const delta = currentScrollY - lastScrollY.current;
      const isScrollingDown = delta > 0;

      if (Math.abs(delta) > 5 && !isAnimating.current) {
        isAnimating.current = true;

        Animated.parallel([
          Animated.timing(fabTranslateY, {
            toValue: isScrollingDown ? 150 : 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(pauseButtonScale, {
            toValue: isScrollingDown ? 0 : 1,
            useNativeDriver: true,
          }),
          Animated.spring(pauseButtonTranslateY, {
            toValue: isScrollingDown ? 100 : 0,
            useNativeDriver: true,
          }),
        ]).start(() => {
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
