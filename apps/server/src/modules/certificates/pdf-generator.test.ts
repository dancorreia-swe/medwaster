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

import { generateCertificatePDF } from "./pdf-generator";

describe("generateCertificatePDF", () => {
  it("renders the study time label and formatted duration", async () => {
    let uploadedPdf: Buffer | undefined;
    mocks.uploadPdf.mockImplementation(async (_key, buffer) => {
      uploadedPdf = Buffer.from(buffer);
      return "https://storage.test/certificate.pdf";
    });

    await generateCertificatePDF({
      id: 123,
      userName: "Ana Teste",
      averageScore: 95,
      totalTrailsCompleted: 4,
      totalTimeMinutes: 125,
      completionDate: new Date("2024-01-02T00:00:00.000Z"),
      verificationCode: "CERT-2024-TEST",
      userImageUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      title: "Certificado de Teste",
      unlockRequirement: "trails",
    });

    expect(mocks.uploadPdf).toHaveBeenCalledOnce();
    expect(uploadedPdf).toBeInstanceOf(Buffer);

    const document = await pdfjsLib.getDocument({
      data: new Uint8Array(uploadedPdf!),
      verbosity: 0,
    }).promise;
    const text = (
      await Promise.all(
        Array.from({ length: document.numPages }, async (_, index) => {
          const page = await document.getPage(index + 1);
          const content = await page.getTextContent();
          return content.items.map((item: any) => item.str).join(" ");
        }),
      )
    ).join(" ");
    const normalizedText = text
      .replace(/\s+/g, " ")
      .replace(/(\d)\s+(?=[a-z])/gi, "$1")
      .toLocaleLowerCase();

    expect(normalizedText).toContain("tempo de estudo");
    expect(normalizedText).toContain("2h 5min");
  });
});
