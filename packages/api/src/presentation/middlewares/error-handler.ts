import type { Context, MiddlewareHandler, Next } from "hono";
import { ValiError } from "valibot";
import { ProjectNameExistsError, ProjectNotFoundError } from "../../domain/errors/project-errors";
import { TagNameExistsError, TagNotFoundError } from "../../domain/errors/tag-errors";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import { ErrorCode, createApiError } from "../errors/api-errors";

/**
 * Global error handling middleware
 */
export const errorHandler = async (err: Error, c: Context, next?: Next): Promise<Response> => {
  try {
    // In test environments, there might be no next function, so check if next is callable
    if (typeof next === "function") {
      await next();
    }
  } catch (error) {
    console.error("Error:", error);
  }

  console.error("Error:", err);

  // Handle domain-specific errors
  if (
    err instanceof TodoNotFoundError ||
    err instanceof TodoActivityNotFoundError ||
    err instanceof TagNotFoundError ||
    err instanceof ProjectNotFoundError
  ) {
    return c.json({ error: createApiError(ErrorCode.NOT_FOUND, err.message) }, 404);
  }

  if (err instanceof InvalidStateTransitionError) {
    return c.json({ error: createApiError(ErrorCode.INVALID_STATE, err.message) }, 400);
  }

  if (err instanceof UnauthorizedActivityDeletionError) {
    return c.json({ error: createApiError(ErrorCode.FORBIDDEN, err.message) }, 403);
  }

  if (err instanceof TagNameExistsError || err instanceof ProjectNameExistsError) {
    return c.json({ error: createApiError(ErrorCode.CONFLICT, err.message) }, 409);
  }

  // Handle validation errors from valibot
  if (err instanceof ValiError) {
    return c.json(
      {
        error: createApiError(ErrorCode.VALIDATION_ERROR, "Validation error"),
        details: err.issues,
      },
      400,
    );
  }

  // Generic error handling
  return c.json(
    {
      error: createApiError(ErrorCode.INTERNAL_ERROR, "Internal Server Error"),
    },
    500,
  );
};
