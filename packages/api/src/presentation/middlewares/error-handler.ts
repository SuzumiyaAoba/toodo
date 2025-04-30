import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
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
export const errorHandler: ErrorHandler = (err: unknown, c) => {
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
  if (err instanceof Error && err.name === "ValiError") {
    errorResponse.code = ErrorCode.BAD_REQUEST;
    errorResponse.message = "Validation error";
    return c.json({ error: errorResponse }, 400);
  }

  // HTTP Exceptions
  if (err instanceof HTTPException) {
    errorResponse.code = ErrorCode.BAD_REQUEST;
    errorResponse.message = err.message;
    return c.json({ error: errorResponse }, err.status);
  }

  // Default error response
  if (err instanceof Error) {
    errorResponse.message = err.message;
  }

  return c.json({ error: errorResponse }, 500);
};
