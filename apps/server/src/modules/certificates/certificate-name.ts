import { getCertificateFontCoverage } from "./pdf/font-coverage";

/** Keep invalid legacy rows actionable at every certificate issuance seam. */
export const CERTIFICATE_NAME_ERROR =
  "Certificate name contains unsupported characters";
export const CERTIFICATE_NAME_UPDATE_GUIDANCE =
  "Não foi possível emitir o certificado porque o nome do estudante contém caracteres não suportados. Atualize o nome do estudante e tente novamente.";

const EMOJI_PRESENTATION_SELECTORS = new Set([0xfe0e, 0xfe0f]);
const EMOJI_JOINER = 0x200d;

const CONTROL = /\p{Cc}/u;
const PRIVATE_USE = /\p{Co}/u;
const UNASSIGNED = /\p{Cn}/u;
const BIDI_CONTROL = /\p{Bidi_Control}/u;
const DEFAULT_IGNORABLE = /\p{Default_Ignorable_Code_Point}/u;
const MARK = /\p{M}/u;
const EXTENDED_PICTOGRAPHIC = /\p{Extended_Pictographic}/u;
const REGIONAL_INDICATOR = /\p{Regional_Indicator}/u;
const EMOJI_MODIFIER = /\p{Emoji_Modifier}/u;
const PUNCTUATION = new Set([
  "'",
  ",",
  ".",
  "\u00b7",
  "\u02bc",
  "\u2010",
  "\u2011",
  "\u2012",
  "\u2013",
  "\u2014",
  "\u2019",
  "\u30fb",
  "-",
]);

const LETTER = /\p{L}/u;

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export class CertificateNameError extends Error {
  constructor() {
    super(CERTIFICATE_NAME_ERROR);
    this.name = "CertificateNameError";
  }
}

const fail = (): never => {
  throw new CertificateNameError();
};

function isEmojiBase(character: string) {
  return (
    EXTENDED_PICTOGRAPHIC.test(character) ||
    REGIONAL_INDICATOR.test(character)
  );
}

function isKeycapGrapheme(codePoints: number[]) {
  if (codePoints.length < 2 || codePoints.length > 3) return false;
  const [base, ...rest] = codePoints;
  if (
    !(
      (base >= 0x30 && base <= 0x39) ||
      base === 0x23 ||
      base === 0x2a
    )
  ) {
    return false;
  }
  return (
    rest.length === 1 && rest[0] === 0x20e3
  ) || (
    rest.length === 2 &&
    EMOJI_PRESENTATION_SELECTORS.has(rest[0]) &&
    rest[1] === 0x20e3
  );
}

function isValidEmojiGrapheme(
  codePoints: number[],
  coverage: ReadonlySet<number>,
) {
  if (isKeycapGrapheme(codePoints)) return true;

  let hasBase = false;
  let needsBase = true;
  for (const codePoint of codePoints) {
    const character = String.fromCodePoint(codePoint);
    if (isEmojiBase(character)) {
      hasBase = true;
      needsBase = false;
      continue;
    }
    if (EMOJI_PRESENTATION_SELECTORS.has(codePoint)) {
      if (needsBase) return false;
      continue;
    }
    if (EMOJI_MODIFIER.test(character)) {
      if (needsBase) return false;
      continue;
    }
    if (codePoint === EMOJI_JOINER) {
      if (needsBase) return false;
      needsBase = true;
      continue;
    }
    return false;
  }

  // The selector and joiner are intentionally exceptions to cmap coverage:
  // they affect shaping but do not have glyphs in Noto Emoji's cmap.
  return hasBase && !needsBase && codePoints.every(
    (codePoint) =>
      EMOJI_PRESENTATION_SELECTORS.has(codePoint) ||
      codePoint === EMOJI_JOINER ||
      coverage.has(codePoint),
  );
}

function validateGrapheme(
  grapheme: string,
  coverage: ReadonlySet<number>,
) {
  const codePoints = [...grapheme].map((character) => character.codePointAt(0)!);

  if (grapheme === " ") return false;

  for (const [index, character] of [...grapheme].entries()) {
    const codePoint = codePoints[index]!;
    if (
      CONTROL.test(character) ||
      PRIVATE_USE.test(character) ||
      UNASSIGNED.test(character) ||
      BIDI_CONTROL.test(character) ||
      (DEFAULT_IGNORABLE.test(character) &&
        !EMOJI_PRESENTATION_SELECTORS.has(codePoint) &&
        codePoint !== EMOJI_JOINER)
    ) {
      fail();
    }

    if (
      !EMOJI_PRESENTATION_SELECTORS.has(codePoint) &&
      codePoint !== EMOJI_JOINER &&
      !coverage.has(codePoint)
    ) {
      fail();
    }
  }

  const emojiGrapheme =
    codePoints.some((codePoint) =>
      isEmojiBase(String.fromCodePoint(codePoint)),
    ) || isKeycapGrapheme(codePoints);
  if (emojiGrapheme) {
    return isValidEmojiGrapheme(codePoints, coverage) || fail();
  }

  let hasSupportedScriptCharacter = false;
  for (const character of [...grapheme]) {
    if (LETTER.test(character)) {
      hasSupportedScriptCharacter = true;
      continue;
    }

    if (MARK.test(character)) continue;
    if (PUNCTUATION.has(character)) continue;
    fail();
  }

  // Combining marks are retained, but a mark cannot be a name by itself.
  if (
    !hasSupportedScriptCharacter &&
    [...grapheme].some((character) => MARK.test(character))
  ) {
    fail();
  }

  return hasSupportedScriptCharacter;
}

/**
 * Normalize and validate the value stored as a user's certificate name.
 * Newlines and all Unicode White_Space characters become ordinary spaces;
 * grapheme clusters are otherwise returned byte-for-byte after NFC.
 */
export function normalizeCertificateName(value: unknown): string {
  if (typeof value !== "string") fail();
  const input = value as string;

  const normalized = input
    .normalize("NFC")
    .replace(/\p{White_Space}+/gu, " ")
    .trim();

  if (!normalized) fail();
  if (Array.from(normalized).length > 255) fail();

  const coverage = getCertificateFontCoverage();
  let hasNameCharacter = false;
  for (const { segment } of segmenter.segment(normalized)) {
    const isNameCharacter = validateGrapheme(segment, coverage);
    hasNameCharacter ||= isNameCharacter;
  }

  if (!hasNameCharacter) fail();
  return normalized;
}

export type CertificateNamePreflight =
  | { ok: true; normalizedName: string }
  | {
      ok: false;
      guidance: typeof CERTIFICATE_NAME_UPDATE_GUIDANCE;
    };

/** Normalize a stored name without making legacy data an issuance exception. */
export function preflightCertificateName(
  value: unknown,
): CertificateNamePreflight {
  try {
    return { ok: true, normalizedName: normalizeCertificateName(value) };
  } catch (error) {
    if (!isCertificateNameError(error)) throw error;
    return { ok: false, guidance: CERTIFICATE_NAME_UPDATE_GUIDANCE };
  }
}

export function isCertificateNameError(
  error: unknown,
): error is CertificateNameError {
  return error instanceof CertificateNameError;
}
