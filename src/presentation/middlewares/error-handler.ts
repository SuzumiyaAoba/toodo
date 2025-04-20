import type { Context, MiddlewareHandler } from "hono";
import { ValiError } from "valibot";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";

/**
 * Global error handling middleware
 */
export const errorHandler: MiddlewareHandler = async (c: Context, next) => {
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);

    // Handle domain-specific errors
    if (error instanceof TodoNotFoundError || error instanceof TodoActivityNotFoundError) {
      return c.json({ error: error.message }, 404);
    }

    if (error instanceof InvalidStateTransitionError) {
      return c.json({ error: error.message }, 400);
    }

    if (error instanceof UnauthorizedActivityDeletionError) {
      return c.json({ error: error.message }, 403);
    }

    // Handle validation errors from valibot
    if (error instanceof ValiError) {
      return c.json({ error: "Validation error", details: error.issues }, 400);
    }

    // Generic error handling
    return c.json({ error: "Internal Server Error" }, 500);
  }
};
