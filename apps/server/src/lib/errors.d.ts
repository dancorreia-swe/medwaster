import { Elysia } from "elysia";
export declare class HttpError extends Error {
    code: string;
    statusCode: number;
    details?: any | undefined;
    constructor(message: string, code: string, statusCode?: number, details?: any | undefined);
    toResponse(): Response;
}
export declare class BadRequestError extends HttpError {
    constructor(message?: string, details?: any);
}
export declare class UnauthorizedError extends HttpError {
    constructor(message?: string);
}
export declare class ForbiddenError extends HttpError {
    constructor(message?: string);
}
export declare class NotFoundError extends HttpError {
    constructor(resource?: string);
}
export declare class ConflictError extends HttpError {
    constructor(message?: string, details?: any);
}
export declare class UnprocessableEntityError extends HttpError {
    constructor(message?: string, details?: any);
}
export declare class TooManyRequestsError extends HttpError {
    constructor(message?: string);
}
export declare class InternalServerError extends HttpError {
    constructor(message?: string);
}
export declare class NotImplementedError extends HttpError {
    constructor(message?: string);
}
export declare class ServiceUnavailableError extends HttpError {
    constructor(message?: string);
}
export declare class ValidationError extends BadRequestError {
    constructor(message: string, details?: any);
}
export declare class BusinessLogicError extends BadRequestError {
    constructor(message: string, code?: string);
}
export declare class DatabaseError extends InternalServerError {
    constructor(message?: string);
}
export declare class ExternalServiceError extends ServiceUnavailableError {
    constructor(service: string, message?: string);
}
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
export declare const globalErrorHandler: Elysia<"", {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    typebox: {};
    error: {};
}, {
    schema: {};
    standaloneSchema: {};
    macro: {};
    macroFn: {};
    parser: {};
    response: {
        200: {
            success: false;
            error: {
                code: string;
                message: string;
                details: any;
                timestamp: string;
                path: string;
                requestId: string | undefined;
            };
        } | {
            success: false;
            error: {
                code: string;
                message: string;
                timestamp: string;
                path: string;
                requestId: string | undefined;
                details?: undefined;
            };
        };
    };
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
    standaloneSchema: {};
    response: {};
}>;
/**
 * Create an error response (for middleware usage)
 */
export declare function errorResponse(code: string, message: string, statusCode?: number, details?: any): ErrorResponse;
/**
 * Async error wrapper for better error handling in async functions
 */
export declare function asyncHandler<T extends any[], R>(fn: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
export declare function isHttpError(error: any): error is HttpError;
export declare function isValidationError(error: any): error is ValidationError;
export declare function isNotFoundError(error: any): error is NotFoundError;
export declare const createError: {
    badRequest: (message?: string, details?: any) => BadRequestError;
    unauthorized: (message?: string) => UnauthorizedError;
    forbidden: (message?: string) => ForbiddenError;
    notFound: (resource?: string) => NotFoundError;
    conflict: (message?: string, details?: any) => ConflictError;
    validation: (message: string, details?: any) => ValidationError;
    businessLogic: (message: string, code?: string) => BusinessLogicError;
    internal: (message?: string) => InternalServerError;
    notImplemented: (message?: string) => NotImplementedError;
    serviceUnavailable: (message?: string) => ServiceUnavailableError;
};
