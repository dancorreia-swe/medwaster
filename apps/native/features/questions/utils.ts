import type { MatchingPair, QuestionAnswer } from "./types";

/**
 * Normalize matching question answers so they always use left/right texts.
 * This ensures we send what the backend expects regardless of local storage format.
 */
export function normalizeMatchingAnswer(
  rawAnswer: QuestionAnswer | null | undefined,
  matchingPairs?: MatchingPair[] | null,
): Record<string, string> {
  if (!rawAnswer || typeof rawAnswer !== "object" || Array.isArray(rawAnswer)) {
    return {};
  }

  if (!matchingPairs || matchingPairs.length === 0) {
    return rawAnswer as Record<string, string>;
  }

  const normalized: Record<string, string> = {};
  const safePairs = matchingPairs.filter(Boolean);

  safePairs.forEach((pair) => {
    if (!pair) return;

    const leftVariants = new Set<string>();
    leftVariants.add(pair.id.toString());
    leftVariants.add(pair.leftText);
    leftVariants.add(pair.leftText.trim());
    leftVariants.add(pair.leftText.toLowerCase());

    let userValue: string | undefined;
    for (const variant of leftVariants) {
      if (variant && variant in (rawAnswer as Record<string, string>)) {
        userValue = (rawAnswer as Record<string, string>)[variant];
        break;
      }
    }

    if (!userValue) {
      return;
    }

    const matchingRight = safePairs.find(
      (candidate) => candidate && candidate.id.toString() === userValue,
    );

    normalized[pair.leftText] = matchingRight
      ? matchingRight.rightText
      : userValue;
  });

  return normalized;
}

export function getMatchingPairsForDisplay(
  answer: Record<string, string> | null | undefined,
  matchingPairs?: MatchingPair[] | null,
): Array<{ id: string; left: string; right: string }> {
  if (!answer) {
    return [];
  }

  const entries = Object.entries(answer);
  if (entries.length === 0) {
    return [];
  }

  if (!matchingPairs || matchingPairs.length === 0) {
    return entries.map(([left, right], index) => ({
      id: `${left}-${right}-${index}`,
      left,
      right,
    }));
  }

  const pairById = new Map<string, MatchingPair>();
  const leftByText = new Map<string, MatchingPair>();
  const rightByText = new Map<string, MatchingPair>();

  matchingPairs.forEach((pair) => {
    if (!pair) return;
    const id = pair.id.toString();
    pairById.set(id, pair);
    leftByText.set(pair.leftText.trim().toLowerCase(), pair);
    rightByText.set(pair.rightText.trim().toLowerCase(), pair);
  });

  const normalize = (value: string) => value.trim().toLowerCase();

  return entries.map(([rawLeft, rawRight], index) => {
    const leftPair =
      pairById.get(rawLeft) || leftByText.get(normalize(rawLeft || ""));
    const rightPair =
      pairById.get(rawRight) || rightByText.get(normalize(rawRight || ""));

    const left = leftPair?.leftText || rawLeft;
    const right = rightPair?.rightText || rawRight;

    return {
      id: `${left}-${right}-${index}`,
      left,
      right,
    };
  });
}
