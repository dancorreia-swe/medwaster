/**
 * Parsing for the comma-separated `CORS_ORIGIN` environment variable.
 *
 * Shared by the CORS plugin (`src/index.ts`) and Better Auth's
 * `trustedOrigins` (`src/lib/auth.ts`) so the two can never disagree about
 * which origins are allowed. Passing the raw string straight to
 * `trustedOrigins` used to inject an empty entry when the variable was unset,
 * and treated `"a,b"` as a single literal origin.
 */
export function parseOriginList(value: string | undefined | null): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
