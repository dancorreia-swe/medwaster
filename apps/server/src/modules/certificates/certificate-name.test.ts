import { describe, expect, it } from "vitest";
import {
  CERTIFICATE_NAME_ERROR,
  CERTIFICATE_NAME_UPDATE_GUIDANCE,
  preflightCertificateName,
  sanitizeCertificateName,
} from "./certificate-name";

describe("sanitizeCertificateName", () => {
  it("composes to NFC so accents print as single glyphs", () => {
    expect(sanitizeCertificateName("Jose\u0301 Silva")).toBe("José Silva");
  });

  it.each(["Zélia Quintanilha", "O'Connor-Silva", "Ana 123", "João Müller"])(
    "keeps a printable name unchanged: %s",
    (name) => {
      expect(sanitizeCertificateName(name)).toBe(name);
    },
  );

  it("canonicalizes Unicode whitespace and newlines to one space", () => {
    expect(sanitizeCertificateName("  Ana\n\tMaria   ")).toBe("Ana Maria");
  });

  it.each([
    ["Ana \u{1f600}", "Ana"],
    ["Ana\u202eMaria", "AnaMaria"],
    ["Ana\u200bMaria", "AnaMaria"],
    ["\u5c71\u7530 Ana", "Ana"],
  ])("drops characters the bundled fonts cannot print: %j", (input, expected) => {
    expect(sanitizeCertificateName(input)).toBe(expected);
  });

  it("truncates at the 255 grapheme API limit", () => {
    expect(sanitizeCertificateName("N".repeat(300))).toBe("N".repeat(255));
  });

  it.each(["", " \n  ", "\u05d0\u05d3\u05dd", "\u0926\u0947\u0935"])(
    "throws when nothing printable remains: %j",
    (name) => {
      expect(() => sanitizeCertificateName(name)).toThrow(CERTIFICATE_NAME_ERROR);
    },
  );
});

describe("preflightCertificateName", () => {
  it("returns a sanitized name for issuance", () => {
    expect(preflightCertificateName("  Jose\u0301  Silva ")).toEqual({
      ok: true,
      normalizedName: "José Silva",
    });
  });

  it("returns actionable guidance for a name with nothing printable", () => {
    expect(preflightCertificateName("\u05d0\u05d3\u05dd")).toEqual({
      ok: false,
      guidance: CERTIFICATE_NAME_UPDATE_GUIDANCE,
    });
  });
});
