import * as Sentry from "@sentry/react-native";
import type { Breadcrumb, ErrorEvent } from "@sentry/react-native";

/**
 * Sentry for the mobile app.
 *
 * EXPO_PUBLIC_* values are inlined at build time, so the SDK is only active in
 * builds made with EXPO_PUBLIC_SENTRY_DSN set (the release APK CI); local dev
 * sends nothing. The release (`<bundleId>@<version>+<build>`) and dist are set
 * by the native SDK and match the source maps uploaded during the build.
 *
 * Privacy: health-adjacent app. No default PII, credentials are scrubbed, only
 * the user id is attached, and replays (on error only) mask all text/images.
 */

const SENSITIVE_QUERY_PARAM =
  /([?&](?:token|access_token|refresh_token|code|password|secret|api_key|apikey|key|signature|x-amz-[a-z-]+)=)[^&#]*/gi;

export function scrubUrl(url: string): string {
  return url.replace(SENSITIVE_QUERY_PARAM, "$1[Filtered]");
}

export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    if (event.request.headers) {
      const { Authorization, authorization, Cookie, cookie, ...rest } =
        event.request.headers;
      event.request.headers = rest;
    }
    if (event.request.url) event.request.url = scrubUrl(event.request.url);
  }
  if (event.user) {
    event.user = event.user.id ? { id: event.user.id } : undefined;
  }
  return event;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  // Console output can contain emails, answers or other personal data.
  if (breadcrumb.category === "console") return null;
  const url = breadcrumb.data?.url;
  if (typeof url === "string") {
    breadcrumb.data = { ...breadcrumb.data, url: scrubUrl(url) };
  }
  return breadcrumb;
}

function apiOriginPattern(): RegExp | undefined {
  const serverUrl = process.env.EXPO_PUBLIC_SERVER_URL;
  const origin = serverUrl?.match(/^https?:\/\/[^/]+/i)?.[0];
  return origin
    ? new RegExp(`^${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|$)`, "i")
    : undefined;
}

function sampleRate(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : fallback;
}

export const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const apiOrigin = apiOriginPattern();

export const isSentryEnabled = Boolean(dsn);

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.EXPO_PUBLIC_SENTRY_ENVIRONMENT ||
      (__DEV__ ? "development" : "production"),
    sendDefaultPii: false,
    tracesSampleRate: sampleRate(
      process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
      0.1,
    ),
    // Only our API gets sentry-trace/baggage headers (links app → API traces).
    tracePropagationTargets: apiOrigin ? [apiOrigin] : [],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      navigationIntegration,
      Sentry.mobileReplayIntegration({
        maskAllText: true,
        maskAllImages: true,
        maskAllVectors: true,
      }),
    ],
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

/** Attach only the user id to subsequent events; pass null on sign-out. */
export function setSentryUser(userId: string | null | undefined) {
  Sentry.setUser(userId ? { id: userId } : null);
}

export { Sentry };
