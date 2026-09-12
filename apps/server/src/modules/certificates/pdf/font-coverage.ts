import * as fontkit from "fontkit";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Every face that can be selected by the certificate PDF font fallbacks. */
export const CERTIFICATE_FONT_FILES = [
  "CormorantGaramond-Medium.ttf",
  "CormorantGaramond-SemiBold.ttf",
  "CormorantGaramond-MediumItalic.ttf",
  "Geist-Regular.ttf",
  "Geist-Medium.ttf",
  "Geist-SemiBold.ttf",
  "NotoSansArabic-Regular.ttf",
  "NotoSansArabic-Medium.ttf",
  "NotoSansArabic-SemiBold.ttf",
  "NotoSansCJKsc-Regular.otf",
  "NotoEmoji.ttf",
] as const;

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

let cachedCertificateFontCoverage: ReadonlySet<number> | undefined;

/**
 * Return the union of the actual cmap entries in all bundled certificate
 * fonts. Loading is intentionally cached: fontkit parsing the CJK font is
 * comparatively expensive and the name validator is used on auth paths.
 */
export function getCertificateFontCoverage(): ReadonlySet<number> {
  if (cachedCertificateFontCoverage) return cachedCertificateFontCoverage;

  const coverage = new Set<number>();
  const fontsDir = resolveCertificateFontsDir();

  for (const file of CERTIFICATE_FONT_FILES) {
    const font = fontkit.openSync(path.join(fontsDir, file));
    for (const codePoint of font.characterSet) {
      coverage.add(codePoint);
    }
  }

  cachedCertificateFontCoverage = coverage;
  return coverage;
}
