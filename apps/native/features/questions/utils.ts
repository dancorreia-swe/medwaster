import type {
  FillBlankOption,
  MatchingPair,
  Question,
  QuestionAnswer,
  QuestionOption,
} from "./types";

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

/**
 * Resolve which of a true/false question's options means "true" and which means
 * "false".
 *
 * The admin editor always writes exactly two rows, `label: "Verdadeiro"` and
 * `label: "Falso"`, so `label` is checked first. `content` keyword matching is
 * kept as a fallback for older/seeded rows, and positional order is the last
 * resort. The two results are always distinct options (or null), so the screen
 * can never render the same option as both buttons.
 */
export function resolveTrueFalseOptions(
  options: QuestionOption[] | null | undefined,
): { trueOption: QuestionOption | null; falseOption: QuestionOption | null } {
  const available = (options ?? []).filter(Boolean);
  if (available.length === 0) {
    return { trueOption: null, falseOption: null };
  }

  const normalize = (value: string | null | undefined) =>
    (value ?? "").trim().toLowerCase();

  const TRUE_WORDS = ["verdadeiro", "true", "sim"];
  const FALSE_WORDS = ["falso", "false", "não", "nao"];

  const byLabel = (words: string[]) =>
    available.find((option) => words.includes(normalize(option.label))) ?? null;

  const byContent = (words: string[], exclude: QuestionOption | null) =>
    available.find(
      (option) =>
        option !== exclude &&
        words.some((word) => normalize(option.content).includes(word)),
    ) ?? null;

  let trueOption = byLabel(TRUE_WORDS);
  let falseOption = byLabel(FALSE_WORDS);

  if (!trueOption) trueOption = byContent(TRUE_WORDS, falseOption);
  if (!falseOption) falseOption = byContent(FALSE_WORDS, trueOption);

  // Positional fallback: first option is "true", second is "false".
  if (!trueOption) {
    trueOption = available.find((option) => option !== falseOption) ?? null;
  }
  if (!falseOption) {
    falseOption = available.find((option) => option !== trueOption) ?? null;
  }

  return { trueOption, falseOption };
}

/**
 * Display text for a fill-in-the-blank option. The column is `text`; the helper
 * exists so call sites do not have to guess at legacy aliases.
 */
export function getFillBlankOptionText(option: FillBlankOption): string {
  return option.text ?? "";
}

/**
 * Fill-in-the-blank options have no `sequence` column, so they are ordered by
 * primary key to keep rendering stable across reloads.
 */
export function sortFillBlankOptions(
  options: FillBlankOption[] | null | undefined,
): FillBlankOption[] {
  return [...(options ?? [])].sort((a, b) => a.id - b.id);
}

/**
 * Derive a question's correct answer from the payload the client already holds.
 *
 * The quiz endpoints never return a `correctAnswer` field on a question, so the
 * in-attempt feedback has to compute it the same way the server's grader does.
 * The shapes returned here match the server's `gradeQuestionAnswer` output, so
 * they can be fed to `formatCorrectAnswerText` alongside a graded response.
 */
export function deriveCorrectAnswer(
  question: Question | null | undefined,
): number[] | Record<string, string> | null {
  if (!question) return null;

  switch (question.type) {
    case "multiple_choice":
    case "true_false":
      return (question.options ?? [])
        .filter((option) => option.isCorrect)
        .map((option) => option.id);

    case "fill_in_the_blank":
      return (question.fillInBlanks ?? []).reduce<Record<string, string>>(
        (accumulator, blank) => {
          const correctOption = blank.options?.find(
            (option) => option.isCorrect,
          );
          accumulator[blank.id.toString()] = correctOption?.text ?? blank.answer;
          return accumulator;
        },
        {},
      );

    case "matching":
      return (question.matchingPairs ?? []).reduce<Record<string, string>>(
        (accumulator, pair) => {
          accumulator[pair.leftText] = pair.rightText;
          return accumulator;
        },
        {},
      );

    default:
      return null;
  }
}

/**
 * Render a correct answer as display text, for every question type.
 *
 * Shared by the standalone/trail result card and the in-quiz feedback so both
 * surfaces describe an answer the same way — previously the quiz path fell
 * through to "Resposta não disponível" for fill-in-the-blank and matching.
 */
export function formatCorrectAnswerText(
  answer: number | number[] | string | Record<string, string> | null | undefined,
  question?: Question | null,
): string {
  if (answer === null || answer === undefined) {
    return "Resposta não disponível";
  }

  if (typeof answer === "string") {
    return answer;
  }

  const optionText = (id: number) => {
    const option = question?.options?.find((candidate) => candidate.id === id);
    return option?.content || `Opção ${id}`;
  };

  if (typeof answer === "number") {
    return optionText(answer);
  }

  if (Array.isArray(answer)) {
    return answer.map(optionText).join(", ");
  }

  if (typeof answer === "object") {
    if (question?.type === "matching") {
      const pairs = getMatchingPairsForDisplay(answer, question.matchingPairs);
      if (pairs.length > 0) {
        return pairs.map((pair) => `${pair.left} → ${pair.right}`).join("\n");
      }
    }

    if (question?.type === "fill_in_the_blank" && question.fillInBlanks) {
      return Object.entries(answer)
        .map(([blankId, value]) => {
          const blank = question.fillInBlanks!.find(
            (candidate) => candidate.id.toString() === blankId,
          );
          const label = blank?.placeholder || `Espaço ${blank?.sequence ?? blankId}`;
          return `${label}: ${value}`;
        })
        .join("\n");
    }

    return Object.entries(answer)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }

  return "Resposta não disponível";
}

// ============================================================================
// Fill-in-the-blank prompt parsing
// ============================================================================

export interface PromptTextSegment {
  type: "text";
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

export interface PromptBlankSegment {
  type: "blank";
  /** 0-based index into the question's sequence-ordered blanks. */
  blankIndex: number;
}

export interface PromptBreakSegment {
  type: "break";
}

export type PromptSegment =
  | PromptTextSegment
  | PromptBlankSegment
  | PromptBreakSegment;

const NAMED_ENTITIES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ndash: "–",
  mdash: "—",
  hellip: "…",
};

export function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = Number.parseInt(entity.slice(2), 16);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    if (entity.startsWith("#")) {
      const code = Number.parseInt(entity.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    const named = NAMED_ENTITIES[entity.toLowerCase()];
    return named ?? match;
  });
}

const BOLD_TAGS = new Set(["b", "strong"]);
const ITALIC_TAGS = new Set(["i", "em"]);
const UNDERLINE_TAGS = new Set(["u", "ins"]);
const STRIKE_TAGS = new Set(["s", "strike", "del"]);
const BLOCK_TAGS = new Set([
  "p",
  "div",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "blockquote",
  "tr",
]);
/** Tag content that must never be shown to the learner. */
const DROPPED_TAGS = new Set(["script", "style"]);

/**
 * Split a fill-in-the-blank prompt into styled runs and blank placeholders.
 *
 * The prompt is authored in the admin's rich-text editor, so it arrives as HTML
 * with `{{1}}`, `{{2}}` … markers where the blanks go. Previously the native
 * screen ran it through a tag-stripper, which threw away every bit of emphasis
 * the author applied — the other three question types render their prompt as
 * HTML, so fill-in-the-blank was the odd one out.
 *
 * This keeps inline emphasis (bold / italic / underline / strikethrough) and
 * block boundaries while still yielding the blanks as separate segments, so
 * they can stay real touch targets rather than inline text.
 */
export function parsePromptSegments(html?: string): PromptSegment[] {
  if (!html) return [];

  const segments: PromptSegment[] = [];
  const styleStack: string[] = [];
  let skipDepth = 0;

  const pushBreak = () => {
    const previous = segments[segments.length - 1];
    if (!previous || previous.type === "break") return;
    segments.push({ type: "break" });
  };

  const pushText = (raw: string) => {
    if (!raw) return;

    // Collapse whitespace the way an HTML renderer would.
    const text = decodeHtmlEntities(raw).replace(/\s+/g, " ");
    if (!text) return;

    const bold = styleStack.some((tag) => BOLD_TAGS.has(tag));
    const italic = styleStack.some((tag) => ITALIC_TAGS.has(tag));
    const underline = styleStack.some((tag) => UNDERLINE_TAGS.has(tag));
    const strikethrough = styleStack.some((tag) => STRIKE_TAGS.has(tag));

    // Split the run on {{n}} blank markers.
    const markers = /\{\{(\d+)\}\}/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = markers.exec(text)) !== null) {
      if (match.index > lastIndex) {
        segments.push({
          type: "text",
          text: text.slice(lastIndex, match.index),
          bold,
          italic,
          underline,
          strikethrough,
        });
      }

      const blankNumber = Number.parseInt(match[1], 10);
      segments.push({ type: "blank", blankIndex: blankNumber - 1 });
      lastIndex = markers.lastIndex;
    }

    if (lastIndex < text.length) {
      segments.push({
        type: "text",
        text: text.slice(lastIndex),
        bold,
        italic,
        underline,
        strikethrough,
      });
    }
  };

  const tokens = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g;
  let cursor = 0;
  let token: RegExpExecArray | null;

  while ((token = tokens.exec(html)) !== null) {
    if (token.index > cursor && skipDepth === 0) {
      pushText(html.slice(cursor, token.index));
    }
    cursor = tokens.lastIndex;

    const tag = token[1].toLowerCase();
    const isClosing = token[0].startsWith("</");
    const isSelfClosing = token[2] === "/";

    if (DROPPED_TAGS.has(tag)) {
      skipDepth += isClosing ? -1 : 1;
      if (skipDepth < 0) skipDepth = 0;
      continue;
    }
    if (skipDepth > 0) continue;

    if (tag === "br") {
      pushBreak();
      continue;
    }

    if (BLOCK_TAGS.has(tag)) {
      pushBreak();
      // Block tags carry no inline emphasis, so they are not stacked.
      continue;
    }

    if (isSelfClosing) continue;

    if (isClosing) {
      const position = styleStack.lastIndexOf(tag);
      if (position !== -1) styleStack.splice(position, 1);
    } else {
      styleStack.push(tag);
    }
  }

  if (cursor < html.length && skipDepth === 0) {
    pushText(html.slice(cursor));
  }

  // A leading or trailing break carries no meaning.
  while (segments.length > 0 && segments[0].type === "break") segments.shift();
  while (
    segments.length > 0 &&
    segments[segments.length - 1].type === "break"
  ) {
    segments.pop();
  }

  return segments;
}

/**
 * Grade an answer locally, mirroring the server's `gradeQuestionAnswer`.
 *
 * Used only for the quiz's immediate feedback — the score of record always
 * comes from the server on submit. Keeping it next to `deriveCorrectAnswer`
 * means the "was I right?" and "what was right?" answers cannot disagree, which
 * they previously did: the quiz copy required a correct *option* on every blank
 * and returned false when a blank carried only its canonical `answer`, marking
 * a correctly typed free-text blank wrong.
 */
export function gradeAnswerLocally(
  question: Question | null | undefined,
  answer: QuestionAnswer | null | undefined,
): boolean {
  if (!question || answer === null || answer === undefined) return false;

  const normalizeText = (value: unknown) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

  switch (question.type) {
    case "multiple_choice":
    case "true_false": {
      const correctIds = (question.options ?? [])
        .filter((option) => option.isCorrect)
        .map((option) => option.id);
      if (correctIds.length === 0) return false;

      const selected = Array.isArray(answer) ? answer : [answer as number];
      return (
        selected.length === correctIds.length &&
        selected.every((id) => correctIds.includes(id as number))
      );
    }

    case "fill_in_the_blank": {
      const blanks = question.fillInBlanks ?? [];
      if (blanks.length === 0) return false;
      if (typeof answer !== "object" || Array.isArray(answer)) return false;

      const given = answer as Record<string, string>;
      return blanks.every((blank) => {
        // Blanks may be authored as multiple choice or as a single canonical
        // answer; the server accepts either, so this must too.
        const expected =
          blank.options?.find((option) => option.isCorrect)?.text ??
          blank.answer;
        if (!expected) return false;
        return normalizeText(given[blank.id.toString()]) === normalizeText(expected);
      });
    }

    case "matching": {
      const pairs = question.matchingPairs ?? [];
      if (pairs.length === 0) return false;
      if (typeof answer !== "object" || Array.isArray(answer)) return false;

      const normalized = normalizeMatchingAnswer(
        answer as Record<string, string>,
        pairs,
      );
      return pairs.every(
        (pair) => normalized[pair.leftText] === pair.rightText,
      );
    }

    default:
      return false;
  }
}
