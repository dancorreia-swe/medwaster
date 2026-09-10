import * as React from "react";

/**
 * Subscribes to a CSS media query. Use when a layout must render *either* one
 * branch or the other — Tailwind's responsive utilities only hide elements, so
 * a portalled component (a Sheet and its overlay) would still mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);

    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
