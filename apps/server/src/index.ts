import "dotenv/config";
import logixlysia from "logixlysia";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { betterAuthMacro as betterAuth } from "./lib/auth";
import { globalErrorHandler } from "./lib/errors";
import { wiki } from "./modules/wiki";
import { questions } from "./modules/questions";
import { tags } from "./modules/tags";
import { audit } from "./modules/audit";
import { auditMiddleware } from "./middleware/audit";

const envCorsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const corsOrigin = envCorsOrigins.includes("*")
  ? true
  : [...envCorsOrigins, /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

const app = new Elysia()
  .use(
    logixlysia({
      config: {
        showStartupMessage: true,
        startupMessageFormat: "simple",
        timestamp: {
          translateTime: "yyyy-mm-dd HH:MM:ss",
        },
        ip: true,
        logFilePath: "./logs/example.log",
        customLogFormat:
          "🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}",
        logFilter: {
          level: ["ERROR", "WARNING", "INFO"],
          status: [500, 404, 200, 201],
          method: ["GET", "POST", "PUT", "DELETE"],
        },
      },
    }),
  )
  .use(
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
      allowedHeaders: ["Content-Type", "Authorization"],
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
  .use(questions)
  .use(tags)
  .use(audit)
  .get("/", () => "OK")
  .listen(3000);

export type App = typeof app;
