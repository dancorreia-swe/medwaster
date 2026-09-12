import { Font } from "@react-pdf/renderer";
import path from "node:path";
import { resolveCertificateFontsDir } from "./font-coverage";

export { resolveCertificateFontsDir } from "./font-coverage";

/** Primary typography first; fallbacks supply scripts absent from the primary. */
export const SERIF = ["Cormorant Garamond", "Noto Sans Arabic", "Noto Sans CJK SC", "Noto Emoji"];
/** Everything else. */
export const SANS = ["Geist", "Noto Sans Arabic", "Noto Sans CJK SC", "Noto Emoji"];
export type CertificateFontFamily = string | string[];

let registered = false;

export function registerCertificateFonts() {
  if (registered) return;

  const dir = resolveCertificateFontsDir();
  const file = (name: string) => path.join(dir, name);

  Font.register({
    family: "Cormorant Garamond",
    fonts: [
      { src: file("CormorantGaramond-Medium.ttf"), fontWeight: 500 },
      { src: file("CormorantGaramond-SemiBold.ttf"), fontWeight: 600 },
      {
        src: file("CormorantGaramond-MediumItalic.ttf"),
        fontWeight: 500,
        fontStyle: "italic",
      },
    ],
  });

  Font.register({
    family: "Geist",
    fonts: [
      { src: file("Geist-Regular.ttf"), fontWeight: 400 },
      { src: file("Geist-Medium.ttf"), fontWeight: 500 },
      { src: file("Geist-SemiBold.ttf"), fontWeight: 600 },
    ],
  });

  Font.register({
    family: "Noto Sans Arabic",
    fonts: [
      { src: file("NotoSansArabic-Regular.ttf"), fontWeight: 400 },
      { src: file("NotoSansArabic-Medium.ttf"), fontWeight: 500 },
      { src: file("NotoSansArabic-SemiBold.ttf"), fontWeight: 600 },
      { src: file("NotoSansArabic-Medium.ttf"), fontWeight: 500, fontStyle: "italic" },
    ],
  });
  Font.register({
    family: "Noto Sans CJK SC",
    fonts: [
      { src: file("NotoSansCJKsc-Regular.otf"), fontWeight: 400 },
      { src: file("NotoSansCJKsc-Regular.otf"), fontWeight: 500 },
      { src: file("NotoSansCJKsc-Regular.otf"), fontWeight: 600 },
      { src: file("NotoSansCJKsc-Regular.otf"), fontWeight: 500, fontStyle: "italic" },
    ],
  });
  Font.register({
    family: "Noto Emoji",
    fonts: [
      { src: file("NotoEmoji.ttf"), fontWeight: 400 },
      { src: file("NotoEmoji.ttf"), fontWeight: 500 },
      { src: file("NotoEmoji.ttf"), fontWeight: 500, fontStyle: "italic" },
      { src: file("NotoEmoji.ttf"), fontWeight: 600 },
    ],
  });

  registered = true;
}
