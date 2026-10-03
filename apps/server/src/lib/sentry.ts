import * as Sentry from "@sentry/elysia";
import type { Breadcrumb, Event } from "@sentry/elysia";

/**
 * Sentry error tracking for the API and the BullMQ worker.
 *
 * Everything is driven by env vars and the SDK stays disabled when SENTRY_DSN
 * is unset, so local development sends nothing. This module must be imported
 * before anything else in an entrypoint so the SDK is initialised first.
 *
 * Privacy: this is a health-adjacent app. SDK v11 replaced `sendDefaultPii`
 * with `dataCollection`, whose defaults collect cookies, bodies, AI prompts and
 * DB data, so every category is switched off explicitly. On top of that,
 * credentials are stripped from requests and breadcrumbs, and only a user id is
 * ever attached.
 */

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "proxy-authorization",
  "x-api-key",
  "x-auth-token",
]);

const SENSITIVE_QUERY_PARAM =
  /([?&](?:token|access_token|refresh_token|code|password|secret|api_key|apikey|key|signature|x-amz-[a-z-]+)=)[^&#]*/gi;

export function scrubUrl(url: string): string {
  return url.replace(SENSITIVE_QUERY_PARAM, "$1[Filtered]");
}

function scrubHeaders(headers: Record<string, string> | undefined) {
  if (!headers) return headers;
  const clean: Record<string, string> = {};
  for (const [name, value] of Object.entries(headers)) {
    clean[name] = SENSITIVE_HEADERS.has(name.toLowerCase())
      ? "[Filtered]"
      : value;
  }
  return clean;
}

// Defence in depth: dataCollection should already keep these out.
export function scrubEvent<T extends Event>(event: T): T {
  if (event.request) {
    delete event.request.cookies;
    // Request bodies can hold answers, profile data or passwords.
    delete event.request.data;
    event.request.headers = scrubHeaders(event.request.headers);
    if (event.request.url) event.request.url = scrubUrl(event.request.url);
    if (typeof event.request.query_string === "string") {
      event.request.query_string = scrubUrl(`?${event.request.query_string}`).slice(1);
    }
  }
  // Only the user id is ever allowed through.
  if (event.user) {
    event.user = event.user.id ? { id: event.user.id } : undefined;
  }
  return event;
}

export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  // Server logs can include emails and other personal data.
  if (breadcrumb.category === "console") return null;
  const url = breadcrumb.data?.url;
  if (typeof url === "string") {
    breadcrumb.data = { ...breadcrumb.data, url: scrubUrl(url) };
  }
  return breadcrumb;
}

function sampleRate(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : fallback;
}

export function initSentry(service: "api" | "worker") {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const tracesSampleRate = sampleRate(
    process.env.SENTRY_TRACES_SAMPLE_RATE,
    0.1,
  );

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    // Baked into the Docker image at build time (git sha).
    release: process.env.SENTRY_RELEASE || undefined,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: { request: { deny: [...SENSITIVE_HEADERS] }, response: false },
      httpBodies: [],
      urlQueryParams: false,
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
    },
    // The container healthcheck polls /api/health every 30s; never trace it.
    tracesSampler: ({ attributes, inheritOrSampleWith }) =>
      attributes?.["url.path"] === "/api/health"
        ? 0
        : inheritOrSampleWith(tracesSampleRate),
    initialScope: { tags: { service } },
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb,
  });
}

/** Attach the authenticated user to the current request's scope (id only). */
export function setSentryUser(userId: string | undefined) {
  Sentry.setUser(userId ? { id: userId } : null);
}

export { Sentry };

interface FailedJob {
  id?: string;
  name: string;
  attemptsMade: number;
  opts: { attempts?: number };
}

/**
 * Report a BullMQ job failure. BullMQ emits `failed` on every attempt, so only
 * the final one is reported to keep quota usage low. Job data is never sent.
 */
export function captureJobFailure(
  queue: string,
  job: FailedJob | undefined,
  error: Error,
) {
  if (job && job.attemptsMade < (job.opts.attempts ?? 1)) return;
  Sentry.withScope((scope) => {
    scope.setTag("queue", queue);
    if (job) {
      scope.setTag("job.name", job.name);
      scope.setContext("job", {
        id: job.id,
        name: job.name,
        attemptsMade: job.attemptsMade,
      });
    }
    Sentry.captureException(error);
  });
}
