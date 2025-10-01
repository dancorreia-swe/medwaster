import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { betterAuthMacro as betterAuth } from "./lib/auth";
import { HttpError } from "./lib/errors";
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
  .onError(({ code, error, set, request }) => {
    console.log("[Global Error Handler] Called with:", { code, error: error.message });
    
    const timestamp = new Date().toISOString();
    const path = new URL(request.url).pathname;
    const requestId = request.headers.get("x-request-id") || undefined;

    // Always set JSON content type for error responses
    set.headers["content-type"] = "application/json";
    
    console.log("[Global Error Handler] Set content-type to application/json");

    // Handle custom HTTP errors
    if (error instanceof HttpError) {
      console.log("[Global Error Handler] Handling HttpError");
      set.status = error.statusCode;
      const response = {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          timestamp,
          path,
          requestId,
        },
      };
      console.log("[Global Error Handler] Returning:", JSON.stringify(response));
      return response;
    }

    // Handle Elysia built-in validation errors
    if (code === "VALIDATION") {
      console.log("[Global Error Handler] Handling validation error");
      set.status = 422;
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error,
          timestamp,
          path,
          requestId,
        },
      };
    }

    // Handle Elysia parse errors
    if (code === "PARSE") {
      console.log("[Global Error Handler] Handling parse error");
      set.status = 400;
      return {
        success: false,
        error: {
          code: "PARSE_ERROR",
          message: "Request body parsing failed",
          timestamp,
          path,
          requestId,
        },
      };
    }

    // Handle Elysia not found errors
    if (code === "NOT_FOUND") {
      console.log("[Global Error Handler] Handling not found error");
      set.status = 404;
      return {
        success: false,
        error: {
          code: "ENDPOINT_NOT_FOUND",
          message: "API endpoint not found",
          timestamp,
          path,
          requestId,
        },
      };
    }

    // Handle unknown/internal errors
    console.log("[Global Error Handler] Handling unknown error");
    console.error("[Global Error Handler]", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      code,
      path,
      timestamp,
      requestId,
    });

    set.status = 500;
    return {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
        timestamp,
        path,
        requestId,
      },
    };
  })
  .get("/test-direct-error", () => {
    throw new Error("Direct test error");
  })
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
