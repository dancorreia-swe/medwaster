import * as React from "react";

/**
 * Subscribes to a CSS media query. Use when a layout must render *either* one
 * branch or the other — Tailwind's responsive utilities only hide elements, so
 * a portalled component (a Sheet and its overlay) would still mount.
 */
export function useMediaQuery(query: string): boolean | undefined {
  // Do not guess on the first render. A false default makes desktop mounts
  // briefly open a mobile Sheet and its portalled overlay before the effect
  // can observe the real viewport.
  const [matches, setMatches] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setMatches(false);
      return;
    }

    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
