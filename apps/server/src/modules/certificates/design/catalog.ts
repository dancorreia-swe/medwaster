/**
 * Built-in Layouts, Palettes and Optional Elements of the Certificate Design.
 *
 * This module is the single source of truth: the PDF renderer, the config
 * service and (through the admin API) the web editor all read from here.
 * Keep it free of React / react-pdf imports so the DB schema can use it.
 */

export const DEFAULT_CERTIFICATE_TITLE = "Conclusão de Trilhas";

export const CERTIFICATE_LAYOUTS = [
  {
    id: "moderno",
    label: "Moderno",
    description: "Cartão com foto ao lado do nome e indicadores em linha.",
  },
  {
    id: "classico",
    label: "Clássico",
    description: "Formal e centralizado, com moldura dupla.",
  },
  {
    id: "minimalista",
    label: "Minimalista",
    description: "Alinhado à esquerda, com bastante espaço em branco.",
  },
] as const;

export type CertificateLayoutId = (typeof CERTIFICATE_LAYOUTS)[number]["id"];

export const CERTIFICATE_LAYOUT_IDS = CERTIFICATE_LAYOUTS.map(
  (layout) => layout.id,
) as [CertificateLayoutId, ...CertificateLayoutId[]];

export interface CertificatePalette {
  id: string;
  label: string;
  /** Name, headings and body text. */
  ink: string;
  /** Borders, bars and rules. Never used for text. */
  accent: string;
  /** Optional second graphic color for small details (e.g. the photo ring). */
  detail?: string;
  /** Light background tint. */
  tint: string;
}

export const CERTIFICATE_PALETTES = [
  {
    id: "educonecta",
    label: "EduConecta",
    ink: "#06285C",
    accent: "#087CC1",
    detail: "#3A9D23",
    tint: "#EFF5FA",
  },
  {
    id: "verde-saude",
    label: "Verde Saúde",
    ink: "#0E3B2E",
    accent: "#2F8F5B",
    tint: "#EEF6F1",
  },
  {
    id: "azul-institucional",
    label: "Azul Institucional",
    ink: "#1C2B4A",
    accent: "#4A6A9B",
    tint: "#F0F3F8",
  },
  {
    id: "grafite",
    label: "Grafite",
    ink: "#1F2429",
    accent: "#6B7580",
    tint: "#F3F4F5",
  },
  {
    id: "vinho",
    label: "Vinho",
    ink: "#4A1528",
    accent: "#9B3353",
    tint: "#F8F0F3",
  },
  {
    id: "terracota",
    label: "Terracota",
    ink: "#43251A",
    accent: "#B8562E",
    tint: "#FAF1EC",
  },
] as const satisfies readonly CertificatePalette[];

export type CertificatePaletteId = (typeof CERTIFICATE_PALETTES)[number]["id"];

export const CERTIFICATE_PALETTE_IDS = CERTIFICATE_PALETTES.map(
  (palette) => palette.id,
) as [CertificatePaletteId, ...CertificatePaletteId[]];

export const OPTIONAL_ELEMENTS = [
  {
    key: "studentPhoto",
    label: "Foto do aluno",
    description: "Sem foto cadastrada, mostra as iniciais.",
  },
  {
    key: "averageScore",
    label: "Média geral",
    description: "Nota média do aluno.",
  },
  {
    key: "completedCount",
    label: "Total concluído",
    description: "Trilhas e/ou artigos, conforme o critério.",
  },
  {
    key: "studyTime",
    label: "Tempo de estudo",
    description: "Horas dedicadas à plataforma.",
  },
  {
    key: "qrCode",
    label: "QR code de verificação",
    description: "Inclui o link para validar o certificado.",
  },
  {
    key: "footerSlogan",
    label: "Slogan no rodapé",
    description: "Frase institucional da EduConecta.",
  },
] as const;

export type OptionalElementKey = (typeof OPTIONAL_ELEMENTS)[number]["key"];

export const OPTIONAL_ELEMENT_KEYS = OPTIONAL_ELEMENTS.map(
  (element) => element.key,
) as OptionalElementKey[];

export type CertificateDesignElements = Record<OptionalElementKey, boolean>;

export interface CertificateDesign {
  layout: CertificateLayoutId;
  palette: CertificatePaletteId;
  elements: CertificateDesignElements;
}

export const DEFAULT_CERTIFICATE_DESIGN: CertificateDesign = {
  layout: "moderno",
  palette: "educonecta",
  elements: {
    studentPhoto: true,
    averageScore: true,
    completedCount: true,
    studyTime: true,
    qrCode: true,
    footerSlogan: true,
  },
};

function isLayoutId(value: unknown): value is CertificateLayoutId {
  return CERTIFICATE_LAYOUT_IDS.includes(value as CertificateLayoutId);
}

function isPaletteId(value: unknown): value is CertificatePaletteId {
  return CERTIFICATE_PALETTE_IDS.includes(value as CertificatePaletteId);
}

/**
 * Coerce any stored or submitted value into a valid Certificate Design.
 * Unknown Layout/Palette ids and missing or malformed toggles fall back to
 * the default, so removing a Palette never breaks rendering.
 */
export function normalizeCertificateDesign(value: unknown): CertificateDesign {
  const source =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const rawElements =
    source.elements && typeof source.elements === "object"
      ? (source.elements as Record<string, unknown>)
      : {};

  const elements = {} as CertificateDesignElements;
  for (const key of OPTIONAL_ELEMENT_KEYS) {
    const raw = rawElements[key];
    elements[key] =
      typeof raw === "boolean" ? raw : DEFAULT_CERTIFICATE_DESIGN.elements[key];
  }

  return {
    layout: isLayoutId(source.layout)
      ? source.layout
      : DEFAULT_CERTIFICATE_DESIGN.layout,
    palette: isPaletteId(source.palette)
      ? source.palette
      : DEFAULT_CERTIFICATE_DESIGN.palette,
    elements,
  };
}

export function getCertificatePalette(id: string): CertificatePalette {
  return (
    CERTIFICATE_PALETTES.find((palette) => palette.id === id) ??
    CERTIFICATE_PALETTES[0]
  );
}

export interface CertificateTheme {
  paper: string;
  ink: string;
  /** Secondary text (captions, sentences), derived from ink. */
  muted: string;
  accent: string;
  detail: string;
  tint: string;
  /** Decorative dividers, derived from accent. */
  hairline: string;
}

/**
 * Colors a Layout draws with. Text only ever uses `ink` or `muted`, on
 * `paper` or `tint`; `accent`, `detail` and `hairline` are graphics only.
 */
export function buildCertificateTheme(
  palette: CertificatePalette,
): CertificateTheme {
  return {
    paper: "#FFFFFF",
    ink: palette.ink,
    muted: mixHex(palette.ink, "#FFFFFF", 0.3),
    accent: palette.accent,
    detail: palette.detail ?? palette.accent,
    tint: palette.tint,
    hairline: mixHex(palette.accent, "#FFFFFF", 0.72),
  };
}

/** Layouts, Palettes and Optional Elements, as exposed to the admin editor. */
export function getCertificateDesignOptions() {
  return {
    layouts: CERTIFICATE_LAYOUTS,
    palettes: CERTIFICATE_PALETTES,
    elements: OPTIONAL_ELEMENTS,
  };
}

/* Color helpers (hex #RRGGBB only). */

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) =>
    parseInt(value.slice(offset, offset + 2), 16),
  ) as [number, number, number];
}

function rgbToHex(rgb: [number, number, number]) {
  return `#${rgb
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

/** Mix `from` towards `to` by `amount` (0 keeps `from`, 1 returns `to`). */
export function mixHex(from: string, to: string, amount: number) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex([0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * amount) as [
    number,
    number,
    number,
  ]);
}

function relativeLuminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio between two colors. */
export function contrastRatio(foreground: string, background: string) {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
