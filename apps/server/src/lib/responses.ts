import { t, type Static, type TSchema } from "elysia";

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create a success response with consistent format
 */
export function success<T>(data: T, meta?: any): SuccessResponse<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function successResponseSchema<const Schema extends TSchema>(
  schema: Schema,
) {
  return t.Object({
    success: t.Literal(true),
    data: schema,
    meta: t.Optional(
      t.Object({
        timestamp: t.String(),
        requestId: t.Optional(t.String()),
      }),
    ),
  });
}

export type SuccessResponseSchema<S extends TSchema> = Static<
  ReturnType<typeof successResponseSchema<S>>
>;

