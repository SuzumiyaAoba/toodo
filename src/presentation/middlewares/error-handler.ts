import type { Context, MiddlewareHandler } from "hono";
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
export const errorHandler: MiddlewareHandler = async (c: Context, next) => {
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);

    // Handle domain-specific errors
    if (
      error instanceof TodoNotFoundError ||
      error instanceof TodoActivityNotFoundError ||
      error instanceof TagNotFoundError ||
      error instanceof ProjectNotFoundError
    ) {
      return c.json({ error: createApiError(ErrorCode.NOT_FOUND, error.message) }, 404);
    }

    if (error instanceof InvalidStateTransitionError) {
      return c.json({ error: createApiError(ErrorCode.INVALID_STATE, error.message) }, 400);
    }

    if (error instanceof UnauthorizedActivityDeletionError) {
      return c.json({ error: createApiError(ErrorCode.FORBIDDEN, error.message) }, 403);
    }

    if (error instanceof TagNameExistsError || error instanceof ProjectNameExistsError) {
      return c.json({ error: createApiError(ErrorCode.CONFLICT, error.message) }, 409);
    }

    // Handle validation errors from valibot
    if (error instanceof ValiError) {
      return c.json(
        {
          error: createApiError(ErrorCode.VALIDATION_ERROR, "Validation error"),
          details: error.issues,
        },
        400,
      );
    }

    // Generic error handling
    return c.json({ error: createApiError(ErrorCode.INTERNAL_ERROR, "Internal Server Error") }, 500);
  }
};
