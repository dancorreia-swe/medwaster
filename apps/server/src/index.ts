import "./instrument";
import logixlysia from "logixlysia";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { join } from "path";
import { betterAuthMacro as betterAuth, OpenAPI } from "./lib/auth";
import { globalErrorHandler, HttpError } from "./lib/errors";
import { Sentry } from "./lib/sentry";
import { adminTags } from "./modules/tags";
import { audit } from "./modules/audit";
import { auditMiddleware } from "./middleware/audit";
import { adminCategories } from "./modules/categories";
import { ai } from "./modules/ai";
import { openapi } from "@elysiajs/openapi";
import { wiki, adminWiki } from "./modules/wiki";
import { adminAchievements, achievements } from "./modules/achievements";
import { adminQuestions } from "./modules/questions";
import { adminQuizzes, studentQuizzes } from "./modules/quizzes";
import { adminTrails, studentTrails } from "./modules/trails";
import { dashboard } from "./modules/dashboard";
import { adminUsers, userProfile } from "./modules/users";
import { profileModule } from "./modules/profile";
import { gamification } from "./modules/gamification";
import { adminCertificates, studentCertificates } from "./modules/certificates";
import { adminConfig } from "./modules/config";
import { adminDebug } from "./modules/debug";
import { initializeCronJobs } from "./lib/cron";
import { parseOriginList } from "./lib/origins";

const isDev = process.env.NODE_ENV === "development";

const envCorsOrigins = parseOriginList(process.env.CORS_ORIGIN);

const corsOrigin = envCorsOrigins.includes("*")
  ? true
  : [...envCorsOrigins, /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

// Elysia's built-in codes for client mistakes (bad body, unknown route, ...).
const CLIENT_ERROR_CODES = new Set([
  "VALIDATION",
  "PARSE",
  "NOT_FOUND",
  "INVALID_COOKIE_SIGNATURE",
  "INVALID_FILE_TYPE",
]);

export const app = Sentry.withElysia(
  new Elysia({ name: "medwaster-api", prefix: "/api" }),
  {
    // Sentry's hook runs before globalErrorHandler sets the status, so decide
    // from the error itself: report server faults only, never 4xx noise.
    shouldHandleError: (context) => {
      const { code, error } = context as typeof context & {
        code: string | number;
        error: unknown;
      };
      if (error instanceof HttpError) return error.statusCode >= 500;
      if (typeof code === "number") return code >= 500;
      return !CLIENT_ERROR_CODES.has(code);
    },
  },
)
  .use(
    logixlysia({
      config: {
        logFilter: {
          level: ["DEBUG", "INFO", "WARNING", "ERROR"],
          status: [200, 201, 204, 400, 401, 403, 404, 500],
          method: ["GET", "POST", "PATCH", "PUT", "DELETE", "HEAD", "OPTIONS"],
        },
        pino: {
          level: isDev ? "debug" : "info",
          prettyPrint: isDev,
          base: {
            service: "medwaster-api",
            version: "1.0.0",
            environment: process.env.NODE_ENV,
          },
          redact: ["password", "token", "apiKey"],
          transport: isDev
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  translateTime: "HH:MM:ss Z",
                  ignore: "pid,hostname",
                },
              }
            : undefined,
        },
        showStartupMessage: true,
        startupMessageFormat: "banner",
        timestamp: {
          translateTime: "yyyy-mm-dd HH:MM:ss",
        },
        logFilePath: "./logs/app.log",
      },
    }),
  )
  .use(
    openapi({
      documentation: {
        components: await OpenAPI.components,
        paths: await OpenAPI.getPaths(),
      },
    }),
  )
  .use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS", "HEAD"],
      // sentry-trace/baggage link web traces to API traces (distributed tracing).
      allowedHeaders: ["Content-Type", "Authorization", "sentry-trace", "baggage"],
      credentials: true,
    }),
  )
  .use(globalErrorHandler)
  .use(betterAuth)
  .use(
    auditMiddleware({
      logSuccess: true,
      logErrors: true,
      logAuthEvents: true,
    }),
  )
  .use(wiki)
  .use(adminWiki)
  .use(adminTags)
  .use(adminCategories)
  .use(adminAchievements)
  .use(achievements)
  .use(adminQuestions)
  .use(adminQuizzes)
  .use(studentQuizzes)
  .use(adminTrails)
  .use(studentTrails)
  .use(dashboard)
  .use(adminUsers)
  .use(userProfile)
  .use(profileModule)
  .use(gamification)
  .use(adminConfig)
  .use(adminDebug)
  .use(adminCertificates)
  .use(studentCertificates)
  .use(audit)
  .use(ai)
  .get("/uploads/questions/:filename", ({ params }) => {
    const filePath = join(process.cwd(), "uploads", "questions", params.filename);
    return Bun.file(filePath);
  })
  .get("/certificates/:filename", ({ params, set }) => {
    const filePath = join(process.cwd(), "storage", "certificates", params.filename);
    const file = Bun.file(filePath);
    
    // Set headers for PDF download
    set.headers["Content-Type"] = "application/pdf";
    set.headers["Content-Disposition"] = `attachment; filename="${params.filename}"`;
    
    return file;
  })
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))
  .get("/", () => "OK")
  .listen(process.env.PORT ? Number(process.env.PORT) : 3000);

// Initialize cron jobs after server starts
initializeCronJobs();

export type App = typeof app;
