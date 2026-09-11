import { describe, expect, it, vi } from "vitest";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const mocks = vi.hoisted(() => ({
  uploadPdf: vi.fn(),
}));

vi.mock("./storage.service", () => ({
  CertificateStorageService: {
    uploadPdf: mocks.uploadPdf,
  },
}));

import {
  generateCertificatePDF,
  renderCertificatePdf,
  type CertificateRenderData,
} from "./pdf-generator";
import {
  CERTIFICATE_LAYOUT_IDS,
  DEFAULT_CERTIFICATE_DESIGN,
  OPTIONAL_ELEMENT_KEYS,
  type CertificateDesign,
  type CertificateDesignElements,
  type CertificateLayoutId,
  type OptionalElementKey,
} from "./design/catalog";
import { formatDate } from "./pdf/shared";
import { BRAND_TAGLINE } from "../../emails/brand";

const PNG_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

// Avoid "fi"/"fl" in fixtures: the fonts' ligatures extract as a single "f".
const baseData: CertificateRenderData = {
  userName: "Zélia Quintanilha",
  averageScore: 92,
  totalTrailsCompleted: 12,
  totalTimeMinutes: 18 * 60 + 30,
  completionDate: new Date("2024-01-02T12:00:00.000Z"),
  verificationCode: "CERT-2024-TEST",
  userImageUrl: null,
  title: "Conclusão de Trilhas Seguras",
  unlockRequirement: "trails",
};

/** Lowercase and strip whitespace, so letter-spaced captions still match. */
const normalize = (value: string) =>
  value.toLocaleLowerCase("pt-BR").replace(/[\s-]+/g, "");

async function inspectPdf(buffer: Buffer) {
  const document = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    verbosity: 0,
  }).promise;

  let text = "";
  let imageCount = 0;
  for (let index = 1; index <= document.numPages; index++) {
    const page = await document.getPage(index);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(" ");
    const operators = await page.getOperatorList();
    imageCount += operators.fnArray.filter(
      (fn) => fn === pdfjsLib.OPS.paintImageXObject,
    ).length;
  }

  return { numPages: document.numPages, text: normalize(text), imageCount };
}

function designWith(
  layout: CertificateLayoutId,
  elements: Partial<CertificateDesignElements>,
): CertificateDesign {
  return {
    ...DEFAULT_CERTIFICATE_DESIGN,
    layout,
    elements: { ...DEFAULT_CERTIFICATE_DESIGN.elements, ...elements },
  };
}

const allOff = Object.fromEntries(
  OPTIONAL_ELEMENT_KEYS.map((key) => [key, false]),
) as CertificateDesignElements;

const alwaysPrinted = [
  baseData.userName,
  baseData.title,
  "Concluiu todas as trilhas de aprendizado com excelência",
  formatDate(baseData.completionDate),
  baseData.verificationCode,
].map(normalize);

/** Text that only appears when each Optional Element is on. */
const optionalMarkers: Record<OptionalElementKey, string[]> = {
  studentPhoto: ["ZQ"],
  averageScore: ["Média geral", "92%"],
  completedCount: ["Trilhas concluídas"],
  studyTime: ["Tempo de estudo", "18h 30min"],
  qrCode: ["/verify/"],
  footerSlogan: [BRAND_TAGLINE],
};

describe("renderCertificatePdf", { timeout: 30_000 }, () => {
  describe.each(CERTIFICATE_LAYOUT_IDS)("%s Layout", (layout) => {
    it("prints the always-printed content and every Optional Element when all are on", async () => {
      const pdf = await inspectPdf(
        await renderCertificatePdf(baseData, designWith(layout, {})),
      );

      expect(pdf.numPages).toBe(1);
      for (const marker of alwaysPrinted) {
        expect(pdf.text).toContain(marker);
      }
      for (const markers of Object.values(optionalMarkers)) {
        for (const marker of markers) {
          expect(pdf.text).toContain(normalize(marker));
        }
      }
    });

    it("omits every Optional Element when all are off", async () => {
      const pdf = await inspectPdf(
        await renderCertificatePdf(baseData, designWith(layout, allOff)),
      );

      expect(pdf.numPages).toBe(1);
      expect(pdf.imageCount).toBe(0);
      for (const marker of alwaysPrinted) {
        expect(pdf.text).toContain(marker);
      }
      for (const markers of Object.values(optionalMarkers)) {
        for (const marker of markers) {
          expect(pdf.text).not.toContain(normalize(marker));
        }
      }
    });

    it("keeps a ~60 character name with a photo on a single page", async () => {
      const userName =
        "Maria Aparecida dos Santos Queiroz de Albuquerque Cavalcanti";
      const pdf = await inspectPdf(
        await renderCertificatePdf(
          {
            ...baseData,
            userName,
            userImageUrl: PNG_PIXEL,
            unlockRequirement: "trails_and_articles",
          },
          designWith(layout, {}),
        ),
      );

      expect(userName.length).toBeGreaterThanOrEqual(58);
      expect(pdf.numPages).toBe(1);
      expect(pdf.text).toContain(normalize(userName));
      expect(pdf.text).toContain(normalize("Trilhas e artigos concluídos"));
    });
  });

  it.each(CERTIFICATE_LAYOUT_IDS)(
    "%s stays on one page at the API text limits, for every Optional Element combination",
    async (layout) => {
      const title = "T".repeat(150);
      const names = [
        "  " + "Nome longo ".repeat(22) + "final  \n",
        "N".repeat(255),
      ];

      for (const userName of names) {
        for (let mask = 0; mask < 1 << OPTIONAL_ELEMENT_KEYS.length; mask++) {
          const elements = Object.fromEntries(
            OPTIONAL_ELEMENT_KEYS.map((key, index) => [
              key,
              Boolean(mask & (1 << index)),
            ]),
          ) as CertificateDesignElements;
          const pdf = await inspectPdf(
            await renderCertificatePdf(
              { ...baseData, title, userName, userImageUrl: PNG_PIXEL },
              designWith(layout, elements),
            ),
          );

          expect(pdf.numPages).toBe(1);
          expect(pdf.text).toContain(normalize(title));
          expect(pdf.text).toContain(normalize(userName));
          for (const marker of alwaysPrinted.slice(2)) {
            expect(pdf.text).toContain(marker);
          }
        }
      }
    },
  );

  it.each(CERTIFICATE_LAYOUT_IDS)(
    "%s preserves representative Unicode names without replacement glyphs",
    async (layout) => {
      for (const userName of ["ليلى أحمد", "山田太郎", "Jose\u0301 Silva", "Ana 😀"]) {
        const pdf = await inspectPdf(
          await renderCertificatePdf(
            { ...baseData, userName },
            designWith(layout, allOff),
          ),
        );
        expect(pdf.numPages).toBe(1);
        for (const character of userName.replace(/\p{M}|\p{Extended_Pictographic}/gu, "")) {
          expect(pdf.text).toContain(normalize(character));
        }
        if (userName.includes("😀")) expect(pdf.text).toContain("ana");
        expect(pdf.text).not.toContain("�");
      }
    },
  );

  it.each(OPTIONAL_ELEMENT_KEYS)(
    "hides only %s when it alone is switched off",
    async (key) => {
      const pdf = await inspectPdf(
        await renderCertificatePdf(
          baseData,
          designWith("moderno", { [key]: false }),
        ),
      );

      for (const [otherKey, markers] of Object.entries(optionalMarkers)) {
        for (const marker of markers) {
          if (otherKey === key) {
            expect(pdf.text).not.toContain(normalize(marker));
          } else {
            expect(pdf.text).toContain(normalize(marker));
          }
        }
      }
    },
  );

  it("embeds the student photo and QR code as images only when enabled", async () => {
    const withPhoto = { ...baseData, userImageUrl: PNG_PIXEL };

    const allOn = await inspectPdf(
      await renderCertificatePdf(withPhoto, DEFAULT_CERTIFICATE_DESIGN),
    );
    const noPhoto = await inspectPdf(
      await renderCertificatePdf(
        withPhoto,
        designWith("moderno", { studentPhoto: false }),
      ),
    );

    expect(allOn.imageCount).toBe(2);
    expect(noPhoto.imageCount).toBe(1);
  });

  it("uses the articles wording when the unlock requirement is articles", async () => {
    const pdf = await inspectPdf(
      await renderCertificatePdf(
        { ...baseData, unlockRequirement: "articles" },
        DEFAULT_CERTIFICATE_DESIGN,
      ),
    );

    expect(pdf.text).toContain(
      normalize("Concluiu todos os artigos de aprendizado com excelência"),
    );
    expect(pdf.text).toContain(normalize("Artigos concluídos"));
  });

  it("falls back to the default Layout and Palette for unknown ids", async () => {
    const unknown = {
      layout: "barroco",
      palette: "neon",
      elements: DEFAULT_CERTIFICATE_DESIGN.elements,
    } as unknown as CertificateDesign;

    const [fallback, reference] = await Promise.all([
      renderCertificatePdf(baseData, unknown).then(inspectPdf),
      renderCertificatePdf(baseData, DEFAULT_CERTIFICATE_DESIGN).then(
        inspectPdf,
      ),
    ]);

    expect(fallback.numPages).toBe(1);
    expect(fallback.text).toBe(reference.text);
  });
});

describe("generateCertificatePDF", { timeout: 30_000 }, () => {
  it("uploads the rendered PDF with the study time label and formatted duration", async () => {
    let uploadedPdf: Buffer | undefined;
    mocks.uploadPdf.mockImplementation(async (_key, buffer) => {
      uploadedPdf = Buffer.from(buffer);
      return "https://storage.test/certificate.pdf";
    });

    const url = await generateCertificatePDF(
      {
        ...baseData,
        id: 123,
        totalTimeMinutes: 125,
        userImageUrl: PNG_PIXEL,
      },
      DEFAULT_CERTIFICATE_DESIGN,
    );

    expect(url).toBe("https://storage.test/certificate.pdf");
    expect(mocks.uploadPdf).toHaveBeenCalledWith(
      "certificate-123-CERT-2024-TEST.pdf",
      expect.any(Buffer),
    );

    const pdf = await inspectPdf(uploadedPdf!);
    expect(pdf.text).toContain("tempodeestudo");
    expect(pdf.text).toContain("2h5min");
  });
});
