import { describe, expect, it } from "vitest";
import {
  CERTIFICATE_NAME_ERROR,
  CERTIFICATE_NAME_UPDATE_GUIDANCE,
  normalizeCertificateName,
  preflightCertificateName,
} from "./certificate-name";

describe("normalizeCertificateName", () => {
  it("normalizes NFC while retaining the grapheme cluster", () => {
    expect(normalizeCertificateName("Jose\u0301 Silva")).toBe("José Silva");
    expect(normalizeCertificateName("👩\u200d🔬 Ana")).toBe("👩\u200d🔬 Ana");
  });

  it.each([
    "Zélia Quintanilha",
    "ليلى أحمد",
    "山田太郎",
    "ひらがな カタカナ",
    "홍길동",
    "Мария Иванова",
    "O'Connor-Silva",
    "Ana 😀",
    "Ana 🦄",
    "Ana ❤️",
  ])("accepts supported certificate name %s", (name) => {
    expect(normalizeCertificateName(name)).toBe(name);
  });

  it("canonicalizes Unicode whitespace and newlines to one space", () => {
    expect(normalizeCertificateName("  Ana\n\tMaria\u00a0  ")).toBe(
      "Ana Maria",
    );
  });

  it.each([
    "",
    " \n\u00a0 ",
    "Ana\u0000Maria",
    "Ana\u202eMaria",
    "Ana\ue000",
    "Ana\u0378",
    "A\u0870",
    "A\u{31350}",
    "A\u{1df00}",
    "A\u093e",
    "A\u200b",
    "A\u200d",
    "A".repeat(256),
  ]) (
    "rejects empty or unsafe name %j",
    (name) => {
      expect(() => normalizeCertificateName(name)).toThrow(CERTIFICATE_NAME_ERROR);
    },
  );

  it.each(["देव", "אדם", "Ana 123"])(
    "rejects unsupported name content %s",
    (name) => {
      expect(() => normalizeCertificateName(name)).toThrow(CERTIFICATE_NAME_ERROR);
    },
  );
});

describe("preflightCertificateName", () => {
  it("returns a normalized name for issuance", () => {
    expect(preflightCertificateName("  Jose\u0301  Silva ")).toEqual({
      ok: true,
      normalizedName: "José Silva",
    });
  });

  it("returns actionable guidance for a legacy unsupported name", () => {
    expect(preflightCertificateName("אדם")).toEqual({
      ok: false,
      guidance: CERTIFICATE_NAME_UPDATE_GUIDANCE,
    });
  });
});
