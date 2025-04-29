import { describe, expect, it, mock } from "bun:test";
import type { Context } from "hono";
import { ValiError } from "valibot";
import { ProjectNameExistsError, ProjectNotFoundError } from "../../domain/errors/project-errors";
import { TagNameExistsError, TagNotFoundError } from "../../domain/errors/tag-errors";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import { ErrorCode } from "../errors/error-codes";
import { errorHandler } from "./error-handler";

// Helper function to create a mock context
const createMockContext = () => ({
  json: mock((...args: unknown[]) => ({ status: 200 })),
});

// Wrapper function for testing the middleware
const runMiddleware = async (error: Error) => {
  const context = createMockContext() as unknown as Context;

  await errorHandler(error, context);
  return context;
};

// Simpler way to mock ValiError
function createValiErrorMock(): unknown {
  // Directly extend Error object
  const error = new Error("Validation error");
  error.name = "ValiError";

  // Add properties needed to function as a ValiError object
  const valiError = Object.assign(error, {
    issues: [{ message: "Invalid input" }],
  });

  // instanceofチェックをパスするためのハック
  Object.setPrototypeOf(valiError, ValiError.prototype);

  return valiError;
}

describe("errorHandler", () => {
  it("should handle TodoNotFoundError with 404 status code", async () => {
    const error = new TodoNotFoundError("test-id");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.NOT_FOUND }) }, 404);
  });

  it("should handle TagNotFoundError with 404 status code", async () => {
    const error = new TagNotFoundError("test-id");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.NOT_FOUND }) }, 404);
  });

  it("should handle ProjectNotFoundError with 404 status code", async () => {
    const error = new ProjectNotFoundError("test-id");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.NOT_FOUND }) }, 404);
  });

  it("should handle TodoActivityNotFoundError with 404 status code", async () => {
    const error = new TodoActivityNotFoundError("test-id");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.NOT_FOUND }) }, 404);
  });

  it("should handle InvalidStateTransitionError with 400 status code", async () => {
    const error = new InvalidStateTransitionError("Cannot transition from COMPLETED to IN_PROGRESS");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith(
      {
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: "Cannot transition from COMPLETED to IN_PROGRESS",
        },
      },
      400,
    );
  });

  it("should handle UnauthorizedActivityDeletionError with 403 status code", async () => {
    const error = new UnauthorizedActivityDeletionError("activity-1", "System activity cannot be deleted");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.FORBIDDEN }) }, 403);
  });

  it("should handle TagNameExistsError with 409 status code", async () => {
    const error = new TagNameExistsError("test-name");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.CONFLICT }) }, 409);
  });

  it("should handle ProjectNameExistsError with 409 status code", async () => {
    const error = new ProjectNameExistsError("test-name");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.CONFLICT }) }, 409);
  });

  it("should handle validation errors with 400 status code", async () => {
    const error = createValiErrorMock() as Error;
    error.name = "ValiError";

    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith(
      {
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: "Validation error",
        },
      },
      400,
    );
  });

  it("should handle unknown errors with 500 status code", async () => {
    const error = new Error("Unknown error");
    const context = await runMiddleware(error);

    expect(context.json).toHaveBeenCalledWith(
      {
        error: {
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: "An unexpected error occurred",
        },
      },
      500,
    );
  });
});
