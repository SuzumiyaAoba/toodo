import type { Context } from "hono";
import { ValiError } from "valibot";
import { ProjectNameExistsError, ProjectNotFoundError } from "../../domain/errors/project-errors";
import { TagNameExistsError, TagNotFoundError } from "../../domain/errors/tag-errors";
import {
  DependencyCycleError,
  DependencyExistsError,
  DependencyNotFoundError,
  InvalidStateTransitionError,
  SelfDependencyError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import { ErrorCode } from "../errors/error-codes";

/**
 * Honoのエラーハンドラー
 */
export const errorHandler = async (err: Error, c: Context) => {
  console.error(err);

  if (err instanceof TodoNotFoundError) {
    c.status(404);
    return c.json({
      code: ErrorCode.TODO_NOT_FOUND,
      message: err.message,
    });
  }

  if (err instanceof TagNotFoundError) {
    c.status(404);
    return c.json({
      code: ErrorCode.TAG_NOT_FOUND,
      message: err.message,
    });
  }

  if (err instanceof ProjectNotFoundError) {
    c.status(404);
    return c.json({
      code: ErrorCode.PROJECT_NOT_FOUND,
      message: err.message,
    });
  }

  if (err instanceof TodoActivityNotFoundError) {
    c.status(404);
    return c.json({
      code: ErrorCode.TODO_ACTIVITY_NOT_FOUND,
      message: err.message,
    });
  }

  if (err instanceof InvalidStateTransitionError) {
    c.status(400);
    return c.json({
      code: ErrorCode.INVALID_STATE_TRANSITION,
      message: err.message,
    });
  }

  if (err instanceof UnauthorizedActivityDeletionError) {
    c.status(403);
    return c.json({
      code: ErrorCode.UNAUTHORIZED_ACTIVITY_DELETION,
      message: err.message,
    });
  }

  if (err instanceof TagNameExistsError) {
    c.status(409);
    return c.json({
      code: ErrorCode.TAG_NAME_EXISTS,
      message: err.message,
    });
  }

  if (err instanceof ProjectNameExistsError) {
    c.status(409);
    return c.json({
      code: ErrorCode.PROJECT_NAME_EXISTS,
      message: err.message,
    });
  }

  if (err instanceof DependencyExistsError) {
    c.status(409);
    return c.json({
      code: ErrorCode.DEPENDENCY_EXISTS,
      message: err.message,
    });
  }

  if (err instanceof DependencyNotFoundError) {
    c.status(404);
    return c.json({
      code: ErrorCode.DEPENDENCY_NOT_FOUND,
      message: err.message,
    });
  }

  if (err instanceof SelfDependencyError) {
    c.status(400);
    return c.json({
      code: ErrorCode.SELF_DEPENDENCY,
      message: err.message,
    });
  }

  if (err instanceof DependencyCycleError) {
    c.status(400);
    return c.json({
      code: ErrorCode.DEPENDENCY_CYCLE,
      message: err.message,
    });
  }

  if (err instanceof ValiError) {
    c.status(400);
    return c.json({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation error",
      issues: err.issues,
    });
  }

  c.status(500);
  return c.json({
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: "Internal server error",
  });
};
