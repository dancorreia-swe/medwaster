import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { betterAuthMacro as betterAuth } from "./lib/auth";
import { wiki } from "./modules/wiki";
import { questions } from "./modules/questions";
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
    cors({
      origin: corsOrigin,
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    }),
  )
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
  .use(audit)
  .get("/", () => "OK")
  .listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });

export type App = typeof app;
