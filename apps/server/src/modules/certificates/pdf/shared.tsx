import type { ReactNode } from "react";
import { Image, Text, View, type Styles } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { BRAND_DISPLAY_NAME, BRAND_TAGLINE } from "../../../emails/brand";
import type { CertificateDesign, CertificateTheme } from "../design/catalog";
import { SANS } from "./fonts";

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

/** Names wrap between words only, never mid-word with a hyphen. */
export const keepWordsWhole = (word: string) => [word];

export function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
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

function sniffImageType(bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) {
    return "image/png";
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  return null;
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
    const bytes = new Uint8Array(await response.arrayBuffer());
    const type = sniffImageType(bytes);
    if (!type) {
      throw new Error("Unsupported user image format");
    }
    return {
      kind: "image",
      src: `data:${type};base64,${Buffer.from(bytes).toString("base64")}`,
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

  return {
    brand: BRAND_DISPLAY_NAME,
    title: data.title,
    userName: data.userName.trim(),
    achievement: getAchievementSentence(data.unlockRequirement),
    completionDate: formatDate(new Date(data.completionDate)),
    verificationCode: data.verificationCode,
    photo: elements.studentPhoto
      ? await loadPhoto(data.userImageUrl, data.userName)
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
  initialsFont: string;
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
