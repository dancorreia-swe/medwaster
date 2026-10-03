import * as Sentry from "@sentry/react";
import type { Breadcrumb, ErrorEvent } from "@sentry/react";
import { getApiUrl, getRuntimeEnv } from "./env";

/**
 * Sentry for the admin web app.
 *
 * The DSN is injected at container start (like VITE_SERVER_URL), so the SDK
 * stays off whenever it is unset — local dev sends nothing.
 *
 * Privacy: health-adjacent app. SDK v11 replaced `sendDefaultPii` with
 * `dataCollection`, whose defaults are permissive, so every category is turned
 * off explicitly. Replays only record on error, with all text and media masked.
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
  if (breadcrumb.category === "navigation") {
    for (const key of ["from", "to"] as const) {
      const value = breadcrumb.data?.[key];
      if (typeof value === "string") {
        breadcrumb.data = { ...breadcrumb.data, [key]: scrubUrl(value) };
      }
    }
  }
  return breadcrumb;
}

function apiOriginPattern(): RegExp | undefined {
  try {
    const origin = new URL(getApiUrl()).origin;
    return new RegExp(`^${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(/|$)`);
  } catch {
    return undefined;
  }
}

function sampleRate(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : fallback;
}

export function initSentry(router: unknown) {
  const dsn = getRuntimeEnv("VITE_SENTRY_DSN");
  if (!dsn) return;

  const apiOrigin = apiOriginPattern();

  Sentry.init({
    dsn,
    environment: getRuntimeEnv("VITE_SENTRY_ENVIRONMENT") || import.meta.env.MODE,
    // Baked in at build time (git sha); matches the source map upload.
    release: import.meta.env.VITE_SENTRY_RELEASE || undefined,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      genAI: { inputs: false, outputs: false },
    },
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: sampleRate(
      getRuntimeEnv("VITE_SENTRY_TRACES_SAMPLE_RATE"),
      0.1,
    ),
    // Only our API gets sentry-trace/baggage headers (links web → API traces).
    tracePropagationTargets: apiOrigin ? [apiOrigin] : [],
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

/** Attach only the user id to subsequent events; pass null on sign-out. */
export function setSentryUser(userId: string | null | undefined) {
  Sentry.setUser(userId ? { id: userId } : null);
}

export { Sentry };
