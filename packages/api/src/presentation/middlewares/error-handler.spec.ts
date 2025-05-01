import { describe, expect, it, mock } from "bun:test";
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
import { errorHandler } from "./error-handler";

const createValiErrorMock = () => {
  const error = new ValiError([
    {
      kind: "schema",
      type: "string",
      input: undefined,
      expected: "string",
      received: "undefined",
      message: "Expected string",
      path: [
        {
          type: "object",
          origin: "value",
          input: {},
          key: "name",
          value: undefined,
        },
      ],
    },
  ]);
  return error;
};

const runMiddleware = async (error: Error) => {
  const context = {
    status: mock(() => {}),
    json: mock(() => {}),
  } as unknown as Context;

  await errorHandler(error, context);
  return context;
};

describe("errorHandler", () => {
  it("should handle TodoNotFoundError with 404 status code", async () => {
    const error = new TodoNotFoundError("test-id");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(404);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.TODO_NOT_FOUND,
      message: error.message,
    });
  });

  it("should handle TagNotFoundError with 404 status code", async () => {
    const error = new TagNotFoundError("test-id");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(404);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.TAG_NOT_FOUND,
      message: error.message,
    });
  });

  it("should handle ProjectNotFoundError with 404 status code", async () => {
    const error = new ProjectNotFoundError("test-id");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(404);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.PROJECT_NOT_FOUND,
      message: error.message,
    });
  });

  it("should handle TodoActivityNotFoundError with 404 status code", async () => {
    const error = new TodoActivityNotFoundError("test-id");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(404);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.TODO_ACTIVITY_NOT_FOUND,
      message: error.message,
    });
  });

  it("should handle InvalidStateTransitionError with 400 status code", async () => {
    const error = new InvalidStateTransitionError("Cannot transition from COMPLETED to IN_PROGRESS");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(400);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.INVALID_STATE_TRANSITION,
      message: error.message,
    });
  });

  it("should handle UnauthorizedActivityDeletionError with 403 status code", async () => {
    const error = new UnauthorizedActivityDeletionError("activity-1", "System activity cannot be deleted");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(403);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.UNAUTHORIZED_ACTIVITY_DELETION,
      message: error.message,
    });
  });

  it("should handle TagNameExistsError with 409 status code", async () => {
    const error = new TagNameExistsError("test-name");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(409);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.TAG_NAME_EXISTS,
      message: error.message,
    });
  });

  it("should handle ProjectNameExistsError with 409 status code", async () => {
    const error = new ProjectNameExistsError("test-name");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(409);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.PROJECT_NAME_EXISTS,
      message: error.message,
    });
  });

  it("should handle DependencyExistsError with 409 status code", async () => {
    const error = new DependencyExistsError("todo-1", "todo-2");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(409);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.DEPENDENCY_EXISTS,
      message: error.message,
    });
  });

  it("should handle DependencyNotFoundError with 404 status code", async () => {
    const error = new DependencyNotFoundError("todo-1", "todo-2");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(404);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.DEPENDENCY_NOT_FOUND,
      message: error.message,
    });
  });

  it("should handle SelfDependencyError with 400 status code", async () => {
    const error = new SelfDependencyError("todo-1");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(400);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.SELF_DEPENDENCY,
      message: error.message,
    });
  });

  it("should handle DependencyCycleError with 400 status code", async () => {
    const error = new DependencyCycleError("todo-1", "todo-2");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(400);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.DEPENDENCY_CYCLE,
      message: error.message,
    });
  });

  it("should handle validation errors with 400 status code", async () => {
    const error = createValiErrorMock();
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(400);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Validation error",
      issues: error.issues,
    });
  });

  it("should handle unknown errors with 500 status code", async () => {
    const error = new Error("Unknown error");
    const context = await runMiddleware(error);

    expect(context.status).toHaveBeenCalledWith(500);
    expect(context.json).toHaveBeenCalledWith({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  });
});
