import { Font } from "@react-pdf/renderer";
import path from "node:path";
import { resolveCertificateFontsDir } from "./font-coverage";

export { resolveCertificateFontsDir } from "./font-coverage";

/** Names and titles. */
export const SERIF = "Cormorant Garamond";
/** Everything else. */
export const SANS = "Geist";
export type CertificateFontFamily = string;

let registered = false;

export function registerCertificateFonts() {
  if (registered) return;

  const dir = resolveCertificateFontsDir();
  const file = (name: string) => path.join(dir, name);

  Font.register({
    family: SERIF,
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
    family: SANS,
    fonts: [
      { src: file("Geist-Regular.ttf"), fontWeight: 400 },
      { src: file("Geist-Medium.ttf"), fontWeight: 500 },
      { src: file("Geist-SemiBold.ttf"), fontWeight: 600 },
    ],
  });

  registered = true;
}
