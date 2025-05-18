import type { Context } from "hono";
import { Logger } from "tslog";
import type { ZodError, ZodSchema } from "zod";

const logger = new Logger({ name: "ValidationUtils" });

/**
 * Type for unified error response format
 */
export type ValidationErrorResponse = {
	error: string;
	details?: Record<string, string>;
};

/**
 * Handle Zod validation errors and return appropriate response
 */
export function handleValidationError(c: Context, error: unknown): Response {
	if (error instanceof Error && "format" in (error as { format?: unknown })) {
		const zodError = error as ZodError;
		const formattedErrors: Record<string, string> = {};

		for (const err of zodError.errors) {
			const path = err.path.join(".");
			formattedErrors[path || "value"] = err.message;
		}

		logger.warn("Validation error:", formattedErrors);

		const errorResponse: ValidationErrorResponse = {
			error: "Validation error occurred",
			details: formattedErrors,
		};

		return c.json(errorResponse, 400);
	}

	logger.error("Unexpected error during validation:", error);
	return c.json(
		{ error: "An error occurred while processing the request" },
		500,
	);
}

/**
 * Helper function to validate request body
 */
export async function validateRequest<T>(
	c: Context,
	schema: ZodSchema,
): Promise<{ success: true; data: T } | Response> {
	try {
		const body = await c.req.json();
		const result = schema.parse(body) as T;
		return { success: true, data: result };
	} catch (error) {
		return handleValidationError(c, error);
	}
}

/**
 * Helper function to validate query parameters
 */
export function validateQuery<T>(
	c: Context,
	schema: ZodSchema,
): { success: true; data: T } | Response {
	try {
		const query = c.req.query();
		const result = schema.parse(query) as T;
		return { success: true, data: result };
	} catch (error) {
		return handleValidationError(c, error);
	}
}
