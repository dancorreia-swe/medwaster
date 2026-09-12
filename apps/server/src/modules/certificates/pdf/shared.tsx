import type { ReactNode } from "react";
import { Image, Text, View, type Styles } from "@react-pdf/renderer";
import resolveImage from "@react-pdf/image";
import { fileTypeFromBuffer } from "file-type";
import QRCode from "qrcode";
import { BRAND_DISPLAY_NAME, BRAND_TAGLINE } from "../../../emails/brand";
import type { CertificateDesign, CertificateTheme } from "../design/catalog";
import { normalizeCertificateName } from "../certificate-name";
import { SANS, type CertificateFontFamily } from "./fonts";

type Style = Styles[string];

export type CertificateUnlockRequirement =
  | "trails"
  | "articles"
  | "trails_and_articles";

export interface CertificateRenderData {
  userName: string;
  averageScore: number;
  totalTrailsCompleted: number;
  totalTimeMinutes: number;
  completionDate: Date;
  verificationCode: string;
  userImageUrl?: string | null;
  title: string;
  unlockRequirement: CertificateUnlockRequirement;
}

export type CertificatePhoto =
  | { kind: "image"; src: string }
  | { kind: "initials"; initials: string };

export interface CertificateStat {
  key: "averageScore" | "completedCount" | "studyTime";
  label: string;
  value: string;
}

/**
 * Everything a Layout prints. Optional Elements that are switched off are
 * already `null` / omitted here, so Layouts never check toggles themselves.
 */
export interface CertificateContent {
  brand: string;
  title: string;
  userName: string;
  achievement: string;
  completionDate: string;
  verificationCode: string;
  photo: CertificatePhoto | null;
  stats: CertificateStat[];
  verification: { displayUrl: string; qrCode: string } | null;
  slogan: string | null;
}

export interface CertificateLayoutProps {
  content: CertificateContent;
  theme: CertificateTheme;
}

const VERIFY_BASE_URL =
  process.env.CERTIFICATE_VERIFY_URL ||
  process.env.PUBLIC_APP_URL ||
  process.env.APP_ORIGIN ||
  process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
  "https://medwaster.com";
const VERIFY_PATH =
  process.env.CERTIFICATE_VERIFY_PATH || "/verify/certificate";

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (remaining > 0 || parts.length === 0) parts.push(`${remaining}min`);
  return parts.join(" ");
}

export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

export function getAchievementSentence(
  unlockRequirement: CertificateUnlockRequirement,
) {
  if (unlockRequirement === "articles") {
    return "Concluiu todos os artigos de aprendizado com excelência";
  }
  if (unlockRequirement === "trails_and_articles") {
    return "Concluiu todas as trilhas e artigos de aprendizado com excelência";
  }
  return "Concluiu todas as trilhas de aprendizado com excelência";
}

export function getCompletedLabel(
  unlockRequirement: CertificateUnlockRequirement,
) {
  if (unlockRequirement === "articles") return "Artigos concluídos";
  if (unlockRequirement === "trails_and_articles") {
    return "Trilhas e artigos concluídos";
  }
  return "Trilhas concluídas";
}

/** Canonical text keeps layout deterministic without changing visible content. */
export function canonicalizeCertificateText(value: string, fallback: string) {
  const text = value
    .normalize("NFC")
    .replace(/[\p{White_Space}\p{Cc}]+/gu, " ")
    .trim();
  return text || fallback;
}

/** Keep grapheme clusters intact while giving long tokens invisible breaks. */
export const keepWordsWhole = (word: string) => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const pieces: string[] = [];
  let piece = "";
  let count = 0;
  for (const { segment } of segmenter.segment(word)) {
    piece += segment;
    if (++count === 18) {
      pieces.push(piece);
      piece = "";
      count = 0;
    }
  }
  if (piece) pieces.push(piece);
  return pieces.length ? pieces : [""];
};

/** Inserts zero-width break opportunities, never visible whitespace. */
export const breakLongText = (text: string) =>
  text.replace(/\S{19,}/gu, (word) => keepWordsWhole(word).join("\u200B"));

export function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const first = parts[0]
    ? segmenter.segment(parts[0])[Symbol.iterator]().next().value?.segment ?? ""
    : "";
  const last = parts.length > 1
    ? segmenter.segment(parts[parts.length - 1])[Symbol.iterator]().next().value?.segment ?? ""
    : "";
  return (first + last).toUpperCase() || "EC";
}

/**
 * Pick a font size so a name stays on one line where possible instead of
 * wrapping. `emPerChar` is the font's average advance width per character.
 */
export function fitFontSize(
  text: string,
  options: { max: number; min: number; width: number; emPerChar: number },
) {
  const ideal =
    options.width / (Math.max(text.trim().length, 1) * options.emPerChar);
  const rounded = Math.floor(ideal * 2) / 2;
  return Math.max(options.min, Math.min(options.max, rounded));
}

export const MAX_CERTIFICATE_AVATAR_BYTES = 5 * 1024 * 1024;

async function readResponseBytes(response: Response): Promise<Uint8Array> {
  const contentLength = Number(
    response.headers?.get?.("content-length"),
  );
  if (Number.isFinite(contentLength) && contentLength > MAX_CERTIFICATE_AVATAR_BYTES) {
    throw new Error("User image exceeds the maximum allowed size");
  }

  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > MAX_CERTIFICATE_AVATAR_BYTES) {
      throw new Error("User image exceeds the maximum allowed size");
    }
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      total += result.value.byteLength;
      if (total > MAX_CERTIFICATE_AVATAR_BYTES) {
        await reader.cancel();
        throw new Error("User image exceeds the maximum allowed size");
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

/** react-pdf only embeds PNG and JPEG; anything else gets initials. */
async function loadPhoto(
  imageUrl: string | null | undefined,
  name: string,
): Promise<CertificatePhoto> {
  const initials: CertificatePhoto = {
    kind: "initials",
    initials: getInitials(name),
  };
  if (!imageUrl) return initials;

  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch user image (${response.status})`);
    }
    const bytes = await readResponseBytes(response);
    const detected = await fileTypeFromBuffer(bytes);
    if (!detected || !["image/png", "image/jpeg"].includes(detected.mime)) {
      throw new Error("Unsupported user image format");
    }

    const format = detected.mime === "image/png" ? "png" : "jpeg";
    const parsed = await resolveImage(
      { data: Buffer.from(bytes), format },
      { cache: false },
    );
    if (
      !parsed ||
      !Number.isFinite(parsed.width) ||
      !Number.isFinite(parsed.height) ||
      parsed.width <= 0 ||
      parsed.height <= 0
    ) {
      throw new Error("User image decoder probe failed");
    }

    return {
      kind: "image",
      src: `data:${detected.mime};base64,${Buffer.from(bytes).toString("base64")}`,
    };
  } catch (error) {
    console.warn("Falling back to initials avatar:", error);
    return initials;
  }
}

export async function buildCertificateContent(
  data: CertificateRenderData,
  design: CertificateDesign,
  theme: CertificateTheme,
): Promise<CertificateContent> {
  const { elements } = design;
  const userName = normalizeCertificateName(data.userName);

  let verification: CertificateContent["verification"] = null;
  if (elements.qrCode) {
    const url = `${VERIFY_BASE_URL.replace(/\/$/, "")}${VERIFY_PATH}/${data.verificationCode}`;
    const qrCode = await QRCode.toDataURL(url, {
      width: 320,
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: theme.ink, light: "#00000000" },
    });
    verification = { displayUrl: url.replace(/^https?:\/\//, ""), qrCode };
  }

  const stats: CertificateStat[] = [];
  if (elements.averageScore) {
    stats.push({
      key: "averageScore",
      label: "Média geral",
      value: `${Math.round(data.averageScore)}%`,
    });
  }
  if (elements.completedCount) {
    stats.push({
      key: "completedCount",
      label: getCompletedLabel(data.unlockRequirement),
      value: String(data.totalTrailsCompleted),
    });
  }
  if (elements.studyTime) {
    stats.push({
      key: "studyTime",
      label: "Tempo de estudo",
      value: formatMinutes(data.totalTimeMinutes),
    });
  }

  const title = canonicalizeCertificateText(data.title, "Certificado");
  return {
    brand: BRAND_DISPLAY_NAME,
    title,
    userName,
    achievement: getAchievementSentence(data.unlockRequirement),
    completionDate: formatDate(new Date(data.completionDate)),
    verificationCode: data.verificationCode,
    photo: elements.studentPhoto
      ? await loadPhoto(data.userImageUrl, userName)
      : null,
    stats,
    verification,
    slogan: elements.footerSlogan ? BRAND_TAGLINE : null,
  };
}

/* Shared building blocks */

export function Caption({
  theme,
  children,
  style,
}: {
  theme: CertificateTheme;
  children: ReactNode;
  style?: Style;
}) {
  return (
    <Text
      style={{
        fontFamily: SANS,
        fontWeight: 500,
        fontSize: 7.5,
        letterSpacing: 1.1,
        textTransform: "uppercase",
        color: theme.muted,
        ...style,
      }}
    >
      {children}
    </Text>
  );
}

export function Avatar({
  photo,
  size,
  theme,
  fill,
  ring,
  initialsFont,
}: {
  photo: CertificatePhoto;
  size: number;
  theme: CertificateTheme;
  /** Background behind initials. */
  fill: string;
  /** Ring color around the circle. */
  ring: string;
  initialsFont: CertificateFontFamily;
}) {
  const ringWidth = Math.max(1.25, size * 0.028);
  const circle: Style = {
    width: size,
    height: size,
    borderRadius: size / 2,
    border: `${ringWidth} solid ${ring}`,
  };

  if (photo.kind === "image") {
    return (
      <View style={{ ...circle, padding: ringWidth * 1.5 }}>
        <Image
          src={photo.src}
          style={{
            width: "100%",
            height: "100%",
            borderRadius: size / 2,
            objectFit: "cover",
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        ...circle,
        backgroundColor: fill,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: initialsFont,
          fontWeight: 600,
          fontSize: size * 0.36,
          lineHeight: 1,
          color: theme.ink,
        }}
      >
        {photo.initials}
      </Text>
    </View>
  );
}
