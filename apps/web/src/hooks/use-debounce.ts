import { useCallback, useEffect, useRef } from "react";

/**
 * useDebouncedCallback
 * Returns a stable debounced version of the provided callback.
 * The debounced function will postpone its execution until after `delay` ms
 * have elapsed since the last time it was invoked.
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
) {
  const cbRef = useRef<T>(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always keep latest callback
  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      cancel();
      timerRef.current = setTimeout(() => {
        cbRef.current(...args);
      }, delay);
    },
    [delay, cancel],
  );

  // Cancel on unmount
  useEffect(() => cancel, [cancel]);

  return Object.assign(debounced, { cancel });
}

/** Simple non-hook utility debounce (for non-React usage) */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
) {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
