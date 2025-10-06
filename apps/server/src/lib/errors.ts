import { Elysia } from "elysia";

// =====================================================
// HTTP Error Classes - Available Application-Wide
// =====================================================

export class HttpError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any,
  ) {
    super(message);
    this.name = "HttpError";
  }

  toResponse() {
    return Response.json(
      {
        success: false,
        error: {
          code: this.code,
          message: this.message,
          details: this.details,
          timestamp: new Date().toISOString(),
          path: "",
        },
      } satisfies ErrorResponse,
      {
        status: this.statusCode,
        headers: {
          "content-type": "application/json",
        },
      },
    );
  }
}

// =====================================================
// 4xx Client Errors
// =====================================================

export class BadRequestError extends HttpError {
  constructor(message: string = "Bad request", details?: any) {
    super(message, "BAD_REQUEST", 400, details);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = "Authentication required") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = "Insufficient permissions") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = "Resource conflict", details?: any) {
    super(message, "CONFLICT", 409, details);
    this.name = "ConflictError";
  }
}

export class UnprocessableEntityError extends HttpError {
  constructor(message: string = "Validation failed", details?: any) {
    super(message, "UNPROCESSABLE_ENTITY", 422, details);
    this.name = "UnprocessableEntityError";
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, "TOO_MANY_REQUESTS", 429);
    this.name = "TooManyRequestsError";
  }
}

// =====================================================
// 5xx Server Errors
// =====================================================

export class InternalServerError extends HttpError {
  constructor(message: string = "Internal server error") {
    super(message, "INTERNAL_SERVER_ERROR", 500);
    this.name = "InternalServerError";
  }
}

export class NotImplementedError extends HttpError {
  constructor(message: string = "Feature not implemented") {
    super(message, "NOT_IMPLEMENTED", 501);
    this.name = "NotImplementedError";
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string = "Service temporarily unavailable") {
    super(message, "SERVICE_UNAVAILABLE", 503);
    this.name = "ServiceUnavailableError";
  }
}

// =====================================================
// Domain-Specific Errors (Business Logic)
// =====================================================

export class ValidationError extends BadRequestError {
  constructor(message: string, details?: any) {
    super(message, details);
    this.code = "VALIDATION_ERROR";
    this.name = "ValidationError";
  }
}

export class BusinessLogicError extends BadRequestError {
  constructor(message: string, code: string = "BUSINESS_LOGIC_ERROR") {
    super(message);
    this.code = code;
    this.name = "BusinessLogicError";
  }
}

export class DatabaseError extends InternalServerError {
  constructor(message: string = "Database operation failed") {
    super(message);
    this.code = "DATABASE_ERROR";
    this.name = "DatabaseError";
  }
}

export class ExternalServiceError extends ServiceUnavailableError {
  constructor(service: string, message?: string) {
    super(message || `${service} service is unavailable`);
    this.code = "EXTERNAL_SERVICE_ERROR";
    this.name = "ExternalServiceError";
  }
}

// =====================================================
// Response Interfaces
// =====================================================

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path: string;
    requestId?: string;
  };
}

// =====================================================
// Global Error Handler for Elysia
// =====================================================

export const globalErrorHandler = new Elysia({
  name: "global-error-handler",
}).onError(({ code, error, set, request }) => {
  console.log("[Global Error Handler] Called with:", {
    code,
    errorType: typeof error,
    errorName: error?.constructor?.name,
    message: "message" in error ? error.message : "Unknown error",
  });

  const timestamp = new Date().toISOString();
  const path = new URL(request.url).pathname;
  const requestId = request.headers.get("x-request-id") || undefined;

  // Always set JSON content type for error responses
  set.headers["content-type"] = "application/json";

  // Handle custom HTTP errors first
  if (error instanceof HttpError) {
    console.log(
      "[Global Error Handler] Handling HttpError:",
      error.constructor.name,
    );
    set.status = error.statusCode;
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        path,
        requestId,
      },
    } satisfies ErrorResponse;
  }

  // Handle specific error codes
  switch (code) {
    case "VALIDATION":
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
      } satisfies ErrorResponse;

    case "PARSE":
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
      } satisfies ErrorResponse;

    case "NOT_FOUND":
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
      } satisfies ErrorResponse;

    default:
      // Handle unknown/internal errors
      console.log("[Global Error Handler] Handling unknown error, code:", code);
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
      } satisfies ErrorResponse;
  }
});

// =====================================================
// Helper Functions
// =====================================================


/**
 * Create an error response (for middleware usage)
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any,
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: "", // Will be filled by the error handler
    },
  };
}

/**
 * Async error wrapper for better error handling in async functions
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Re-throw HttpErrors as-is, wrap others
      if (error instanceof HttpError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new InternalServerError(error.message);
      }

      throw new InternalServerError("An unexpected error occurred");
    }
  };
}

// =====================================================
// Type Guards
// =====================================================

export function isHttpError(error: any): error is HttpError {
  return error instanceof HttpError;
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: any): error is NotFoundError {
  return error instanceof NotFoundError;
}

// =====================================================
// Error Factory Functions (Optional Convenience)
// =====================================================

export const createError = {
  badRequest: (message?: string, details?: any) =>
    new BadRequestError(message, details),
  unauthorized: (message?: string) => new UnauthorizedError(message),
  forbidden: (message?: string) => new ForbiddenError(message),
  notFound: (resource?: string) => new NotFoundError(resource),
  conflict: (message?: string, details?: any) =>
    new ConflictError(message, details),
  validation: (message: string, details?: any) =>
    new ValidationError(message, details),
  businessLogic: (message: string, code?: string) =>
    new BusinessLogicError(message, code),
  internal: (message?: string) => new InternalServerError(message),
  notImplemented: (message?: string) => new NotImplementedError(message),
  serviceUnavailable: (message?: string) =>
    new ServiceUnavailableError(message),
};

// =====================================================
// Export All Error Classes for Easy Importing
// =====================================================
// Note: Classes are already exported individually above
