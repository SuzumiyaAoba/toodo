import type { Context, MiddlewareHandler, Next } from "hono";
import { validator } from "hono/validator";
import type { z } from "zod";

/**
 * Creates a middleware that validates request parameters using Zod schemas
 */
export const zodValidator = <
	T extends {
		params?: z.ZodType<any>;
		query?: z.ZodType<any>;
		json?: z.ZodType<any>;
	},
>(
	schemas: T,
) => {
	// @ts-ignore: Honoのバリデータは"zod"タイプをサポートしていませんが、カスタム実装として使用します
	return validator("zod", (value, c) => {
		const errors: Record<string, string> = {};
		let hasErrors = false;

		if (schemas.params && value.params) {
			try {
				schemas.params.parse(value.params);
			} catch (e: unknown) {
				hasErrors = true;
				if (
					e &&
					typeof e === "object" &&
					"errors" in e &&
					Array.isArray(e.errors)
				) {
					for (const err of e.errors) {
						if (
							err &&
							typeof err === "object" &&
							"path" in err &&
							Array.isArray(err.path) &&
							"message" in err &&
							typeof err.message === "string"
						) {
							const path = err.path.join(".");
							errors[`params.${path || "value"}`] = err.message;
						}
					}
				}
			}
		}

		if (schemas.query && value.query) {
			try {
				schemas.query.parse(value.query);
			} catch (e: unknown) {
				hasErrors = true;
				if (
					e &&
					typeof e === "object" &&
					"errors" in e &&
					Array.isArray(e.errors)
				) {
					for (const err of e.errors) {
						if (
							err &&
							typeof err === "object" &&
							"path" in err &&
							Array.isArray(err.path) &&
							"message" in err &&
							typeof err.message === "string"
						) {
							const path = err.path.join(".");
							errors[`query.${path || "value"}`] = err.message;
						}
					}
				}
			}
		}

		if (schemas.json && value.json) {
			try {
				schemas.json.parse(value.json);
			} catch (e: unknown) {
				hasErrors = true;
				if (
					e &&
					typeof e === "object" &&
					"errors" in e &&
					Array.isArray(e.errors)
				) {
					for (const err of e.errors) {
						if (
							err &&
							typeof err === "object" &&
							"path" in err &&
							Array.isArray(err.path) &&
							"message" in err &&
							typeof err.message === "string"
						) {
							const path = err.path.join(".");
							errors[`body.${path || "value"}`] = err.message;
						}
					}
				}
			}
		}

		if (hasErrors) {
			return c.json(
				{
					error: "Validation error occurred",
					details: errors,
				},
				400,
			);
		}

		return value;
	});
};

/**
 * Middleware for validating request body against a Zod schema
 */
export const validateBody = <T>(schema: z.ZodType<T>): MiddlewareHandler => {
	return async (c: Context, next: Next) => {
		try {
			const body = await c.req.json();
			schema.parse(body);
			// Continue with validated data
			await next();
			return new Response();
		} catch (error: unknown) {
			const errors: Record<string, string> = {};

			if (
				error &&
				typeof error === "object" &&
				"errors" in error &&
				Array.isArray(error.errors)
			) {
				for (const err of error.errors) {
					if (
						err &&
						typeof err === "object" &&
						"path" in err &&
						Array.isArray(err.path) &&
						"message" in err &&
						typeof err.message === "string"
					) {
						const path = err.path.join(".");
						errors[path || "value"] = err.message;
					}
				}
			}

			return c.json(
				{
					error: "Validation error occurred",
					details: errors,
				},
				400,
			);
		}
	};
};

/**
 * Middleware for validating URL parameters against a Zod schema
 */
export const validateParams = <T>(schema: z.ZodType<T>): MiddlewareHandler => {
	return async (c: Context, next: Next) => {
		try {
			const params = c.req.param();
			schema.parse(params);
			await next();
			return new Response();
		} catch (error: unknown) {
			const errors: Record<string, string> = {};

			if (
				error &&
				typeof error === "object" &&
				"errors" in error &&
				Array.isArray(error.errors)
			) {
				for (const err of error.errors) {
					if (
						err &&
						typeof err === "object" &&
						"path" in err &&
						Array.isArray(err.path) &&
						"message" in err &&
						typeof err.message === "string"
					) {
						const path = err.path.join(".");
						errors[path || "value"] = err.message;
					}
				}
			}

			return c.json(
				{
					error: "Validation error occurred in URL parameters",
					details: errors,
				},
				400,
			);
		}
	};
};

/**
 * Middleware for validating query parameters against a Zod schema
 */
export const validateQuery = <T>(schema: z.ZodType<T>): MiddlewareHandler => {
	return async (c: Context, next: Next) => {
		try {
			const query = c.req.query();
			schema.parse(query);
			await next();
			return new Response();
		} catch (error: unknown) {
			const errors: Record<string, string> = {};

			if (
				error &&
				typeof error === "object" &&
				"errors" in error &&
				Array.isArray(error.errors)
			) {
				for (const err of error.errors) {
					if (
						err &&
						typeof err === "object" &&
						"path" in err &&
						Array.isArray(err.path) &&
						"message" in err &&
						typeof err.message === "string"
					) {
						const path = err.path.join(".");
						errors[path || "value"] = err.message;
					}
				}
			}

			return c.json(
				{
					error: "Validation error occurred in query parameters",
					details: errors,
				},
				400,
			);
		}
	};
};
