import { Font } from "@react-pdf/renderer";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Primary typography first; fallbacks supply scripts absent from the primary. */
export const SERIF = ["Cormorant Garamond", "Noto Sans Arabic", "Noto Sans CJK SC", "Noto Emoji"];
/** Everything else. */
export const SANS = ["Geist", "Noto Sans Arabic", "Noto Sans CJK SC", "Noto Emoji"];
export type CertificateFontFamily = string | string[];

const PROBE_FILE = "Geist-Regular.ttf";

/**
 * The OFL fonts live in apps/server/assets/fonts. This module runs from
 * src/modules/... (dev, tests) or is bundled into dist/index.js (tsdown), so
 * walk up from both this file and the cwd until the folder is found.
 */
export function resolveCertificateFontsDir(): string {
  const starts = [process.cwd()];
  try {
    starts.unshift(path.dirname(fileURLToPath(import.meta.url)));
  } catch {
    // import.meta.url is not a file URL (e.g. a compiled binary): cwd only.
  }

  for (const start of starts) {
    let dir = start;
    while (true) {
      for (const candidate of [
        path.join(dir, "assets", "fonts"),
        path.join(dir, "apps", "server", "assets", "fonts"),
      ]) {
        if (existsSync(path.join(candidate, PROBE_FILE))) {
          return candidate;
        }
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }

  throw new Error(
    `Certificate fonts not found (looked for assets/fonts/${PROBE_FILE} above ${starts.join(", ")})`,
  );
}

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
