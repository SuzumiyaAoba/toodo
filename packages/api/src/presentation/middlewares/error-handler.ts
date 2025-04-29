import type { ErrorHandler } from "hono";
import { ProjectNameExistsError, ProjectNotFoundError } from "../../domain/errors/project-errors";
import { TagNameExistsError, TagNotFoundError } from "../../domain/errors/tag-errors";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import { ErrorCode, type ErrorResponse } from "../errors/error-codes";

/**
 * Honoのエラーハンドラー
 */
export const errorHandler: ErrorHandler = (err, c) => {
  console.error(err);

  const errorResponse: ErrorResponse = {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: "An unexpected error occurred",
  };

  // Not Found Errors
  if (
    err instanceof TodoNotFoundError ||
    err instanceof TodoActivityNotFoundError ||
    err instanceof TagNotFoundError ||
    err instanceof ProjectNotFoundError
  ) {
    errorResponse.code = ErrorCode.NOT_FOUND;
    errorResponse.message = err.message;
    return c.json({ error: errorResponse }, 404);
  }

  // Bad Request Errors
  if (err instanceof InvalidStateTransitionError) {
    errorResponse.code = ErrorCode.BAD_REQUEST;
    errorResponse.message = err.message;
    return c.json({ error: errorResponse }, 400);
  }

  // Forbidden Errors
  if (err instanceof UnauthorizedActivityDeletionError) {
    errorResponse.code = ErrorCode.FORBIDDEN;
    errorResponse.message = err.message;
    return c.json({ error: errorResponse }, 403);
  }

  // Conflict Errors
  if (err instanceof TagNameExistsError || err instanceof ProjectNameExistsError) {
    errorResponse.code = ErrorCode.CONFLICT;
    errorResponse.message = err.message;
    return c.json({ error: errorResponse }, 409);
  }

  // Validation Errors
  if (err.name === "ValiError") {
    errorResponse.code = ErrorCode.BAD_REQUEST;
    errorResponse.message = "Validation error";
    return c.json({ error: errorResponse }, 400);
  }

  // Default error response
  return c.json({ error: errorResponse }, 500);
};
