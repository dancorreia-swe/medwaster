import { getCertificateFontCoverage } from "./pdf/font-coverage";

/**
 * A certificate is a credential: it must print the student's name, never a
 * placeholder and never replacement boxes. So a name is sanitized (anything
 * the bundled fonts cannot draw is dropped) and only a name with nothing
 * printable left stops issuance, with guidance for the admin.
 */
export const CERTIFICATE_NAME_ERROR =
  "Certificate name has no printable characters";
export const CERTIFICATE_NAME_UPDATE_GUIDANCE =
  "Não foi possível emitir o certificado porque o nome do estudante não tem caracteres que possam ser impressos. Atualize o nome do estudante e tente novamente.";

/** Matches the API limit for a stored user name. */
const MAX_NAME_GRAPHEMES = 255;

const UNPRINTABLE =
  /\p{Cc}|\p{Co}|\p{Cn}|\p{Cs}|\p{Bidi_Control}|\p{Default_Ignorable_Code_Point}/u;

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export class CertificateNameError extends Error {
  constructor() {
    super(CERTIFICATE_NAME_ERROR);
    this.name = "CertificateNameError";
  }
}

export function isCertificateNameError(
  error: unknown,
): error is CertificateNameError {
  return error instanceof CertificateNameError;
}

/** A grapheme prints only if every code point in it has a glyph. */
function isPrintable(grapheme: string, coverage: ReadonlySet<number>) {
  for (const character of grapheme) {
    if (UNPRINTABLE.test(character)) return false;
    if (!coverage.has(character.codePointAt(0)!)) return false;
  }
  return true;
}

/**
 * Normalize a stored name for printing: NFC, all Unicode whitespace collapsed
 * to ordinary spaces, and any grapheme the bundled fonts cannot draw dropped.
 * Throws only when nothing printable remains.
 */
export function sanitizeCertificateName(value: unknown): string {
  const input = typeof value === "string" ? value : "";
  const normalized = input
    .normalize("NFC")
    .replace(/\p{White_Space}+/gu, " ")
    .trim();

  const coverage = getCertificateFontCoverage();
  const kept: string[] = [];
  let dropped = 0;

  for (const { segment } of segmenter.segment(normalized)) {
    if (kept.length >= MAX_NAME_GRAPHEMES) break;
    if (isPrintable(segment, coverage)) {
      kept.push(segment);
    } else {
      dropped += 1;
    }
  }

  if (dropped > 0) {
    console.warn(
      `Certificate name: dropped ${dropped} character(s) the bundled fonts cannot print`,
    );
  }

  const sanitized = kept.join("").replace(/ +/g, " ").trim();
  if (!sanitized) {
    throw new CertificateNameError();
  }

  return sanitized;
}

export type CertificateNamePreflight =
  | { ok: true; normalizedName: string }
  | { ok: false; guidance: typeof CERTIFICATE_NAME_UPDATE_GUIDANCE };

/** Sanitize a stored name without making legacy data throw at issuance. */
export function preflightCertificateName(
  value: unknown,
): CertificateNamePreflight {
  try {
    return { ok: true, normalizedName: sanitizeCertificateName(value) };
  } catch (error) {
    if (!isCertificateNameError(error)) throw error;
    return { ok: false, guidance: CERTIFICATE_NAME_UPDATE_GUIDANCE };
  }
}
