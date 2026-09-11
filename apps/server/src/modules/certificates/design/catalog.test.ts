import { describe, expect, it } from "vitest";
import { BRAND_COLORS } from "../../../emails/brand";
import {
  CERTIFICATE_LAYOUT_IDS,
  CERTIFICATE_PALETTES,
  CERTIFICATE_PALETTE_IDS,
  DEFAULT_CERTIFICATE_DESIGN,
  OPTIONAL_ELEMENT_KEYS,
  buildCertificateTheme,
  contrastRatio,
  normalizeCertificateDesign,
} from "./catalog";

describe("normalizeCertificateDesign", () => {
  it.each([null, undefined, "moderno", 42, []])(
    "returns the default design for %j",
    (value) => {
      expect(normalizeCertificateDesign(value)).toEqual(
        DEFAULT_CERTIFICATE_DESIGN,
      );
    },
  );

  it("keeps a valid design as-is", () => {
    const design = {
      layout: "classico",
      palette: "vinho",
      elements: {
        studentPhoto: false,
        averageScore: true,
        completedCount: false,
        studyTime: true,
        qrCode: false,
        footerSlogan: true,
      },
    };

    expect(normalizeCertificateDesign(design)).toEqual(design);
  });

  it("falls back per field for unknown ids and missing or malformed toggles", () => {
    expect(
      normalizeCertificateDesign({
        layout: "barroco",
        palette: "neon",
        elements: { studentPhoto: false, qrCode: "no", confetti: true },
      }),
    ).toEqual({
      layout: DEFAULT_CERTIFICATE_DESIGN.layout,
      palette: DEFAULT_CERTIFICATE_DESIGN.palette,
      elements: { ...DEFAULT_CERTIFICATE_DESIGN.elements, studentPhoto: false },
    });
  });
});

describe("certificate design catalog", () => {
  it("defaults to Moderno + EduConecta with every Optional Element on", () => {
    expect(DEFAULT_CERTIFICATE_DESIGN.layout).toBe("moderno");
    expect(DEFAULT_CERTIFICATE_DESIGN.palette).toBe("educonecta");
    expect(Object.keys(DEFAULT_CERTIFICATE_DESIGN.elements).sort()).toEqual(
      [...OPTIONAL_ELEMENT_KEYS].sort(),
    );
    expect(
      Object.values(DEFAULT_CERTIFICATE_DESIGN.elements).every(Boolean),
    ).toBe(true);
  });

  it("has unique ids", () => {
    expect(new Set(CERTIFICATE_LAYOUT_IDS).size).toBe(
      CERTIFICATE_LAYOUT_IDS.length,
    );
    expect(new Set(CERTIFICATE_PALETTE_IDS).size).toBe(
      CERTIFICATE_PALETTE_IDS.length,
    );
  });

  it("uses the brand colors for the EduConecta Palette", () => {
    const educonecta = CERTIFICATE_PALETTES.find((p) => p.id === "educonecta");
    expect(educonecta).toMatchObject({
      ink: BRAND_COLORS.navy,
      accent: BRAND_COLORS.blue,
      detail: BRAND_COLORS.green,
    });
  });

  it.each(CERTIFICATE_PALETTES.map((palette) => [palette.label, palette]))(
    "%s meets WCAG AA contrast on every background a Layout uses",
    (_label, palette) => {
      const theme = buildCertificateTheme(palette);

      for (const background of [theme.paper, theme.tint]) {
        // Text: AA for small text.
        expect(contrastRatio(theme.ink, background)).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(theme.muted, background)).toBeGreaterThanOrEqual(
          4.5,
        );
        // Graphics (bars, borders, photo ring): AA for non-text contrast.
        expect(contrastRatio(theme.accent, background)).toBeGreaterThanOrEqual(
          3,
        );
        expect(contrastRatio(theme.detail, background)).toBeGreaterThanOrEqual(
          3,
        );
      }
    },
  );
});
