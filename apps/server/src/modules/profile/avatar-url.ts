/**
 * Avatar URLs are served through the API (`GET /api/profile/avatar/:key`)
 * rather than pointing clients straight at MinIO.
 *
 * Pointing at MinIO made every avatar depend on `PUBLIC_S3_ENDPOINT` being set
 * to a publicly reachable, HTTPS origin and on the bucket carrying a public-read
 * policy. When `PUBLIC_S3_ENDPOINT` is unset the URL falls back to the internal
 * `S3_ENDPOINT` (`http://minio:9000/...`), which no phone can load, so the
 * uploaded picture never showed up. The API origin is, by definition, one the
 * client can already reach.
 */

export const AVATAR_ROUTE_PATH = "/api/profile/avatar";

const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** Keys are generated server-side as `<uuid>.<ext>`; nothing else is served. */
const AVATAR_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.(jpg|png|gif|webp))?$/i;

export function isValidAvatarKey(key: string): boolean {
  return AVATAR_KEY_PATTERN.test(key);
}

/** Builds the object key from the MIME type, never from the client filename. */
export function avatarKeyFor(id: string, mimeType: string): string {
  const extension = MIME_EXTENSIONS[mimeType];
  return extension ? `${id}.${extension}` : id;
}

function firstHeaderValue(value: string | null): string | undefined {
  return value?.split(",")[0]?.trim() || undefined;
}

/**
 * The origin the client used to reach the API, honouring the
 * `X-Forwarded-*` headers set by the reverse proxy (Caddy / Traefik).
 */
export function publicOriginFromRequest(request: Request): string {
  const url = new URL(request.url);
  const proto =
    firstHeaderValue(request.headers.get("x-forwarded-proto")) ??
    url.protocol.replace(/:$/, "");
  const host =
    firstHeaderValue(request.headers.get("x-forwarded-host")) ?? url.host;

  return `${proto}://${host}`;
}

export function buildAvatarUrl(origin: string, key: string): string {
  return `${origin.replace(/\/+$/, "")}${AVATAR_ROUTE_PATH}/${key}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Recovers the object key from a stored avatar URL so the old object can be
 * deleted. Understands both the API URL and legacy direct-MinIO URLs
 * (`<endpoint>/<bucket>/<key>`). Returns null for anything else, e.g. a
 * Google profile picture.
 */
export function extractAvatarKey(
  url: string,
  options: { bucket: string; legacyEndpoints: string[] },
): string | null {
  const apiMatch = url.match(
    new RegExp(`${escapeRegExp(AVATAR_ROUTE_PATH)}/([^/?#]+)$`),
  );
  if (apiMatch) {
    return isValidAvatarKey(apiMatch[1]) ? apiMatch[1] : null;
  }

  for (const endpoint of options.legacyEndpoints) {
    if (!endpoint) continue;
    const match = url.match(
      new RegExp(
        `^${escapeRegExp(endpoint.replace(/\/+$/, ""))}/${escapeRegExp(options.bucket)}/(.+)$`,
      ),
    );
    if (match) return match[1];
  }

  return null;
}
