import { describe, expect, it, mock } from "bun:test";
import { ValiError } from "valibot";
import { TagNameExistsError, TagNotFoundError } from "../../domain/errors/tag-errors";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import { ErrorCode } from "../errors/api-errors";
import { errorHandler } from "./error-handler";

// Helper function to create a mock context
const createMockContext = () => ({
  json: mock((...args: unknown[]) => ({ status: 200 })),
});

// Helper function to create a mock next function
const createNextFunction = (shouldThrow = false, error?: Error) => {
  return mock(async () => {
    if (shouldThrow) {
      throw error;
    }
  });
};

// より単純なValiErrorのモック方法
function createValiErrorMock(): unknown {
  // Errorオブジェクトを直接拡張
  const error = new Error("Validation error");
  error.name = "ValiError";

  // ValiErrorオブジェクトとして機能するために必要なプロパティを追加
  const valiError = Object.assign(error, {
    issues: [{ message: "Invalid input" }],
  });

  // instanceofチェックをパスするためのハック
  Object.setPrototypeOf(valiError, ValiError.prototype);

  return valiError;
}

describe("errorHandler", () => {
  it("should handle TodoNotFoundError with 404 status code", async () => {
    const context = createMockContext();
    const error = new TodoNotFoundError("test-id");
    const next = createNextFunction(true, error);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.NOT_FOUND }) }, 404);
  });

  it("should handle TagNotFoundError with 404 status code", async () => {
    const context = createMockContext();
    const error = new TagNotFoundError("test-id");
    const next = createNextFunction(true, error);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.NOT_FOUND }) }, 404);
  });

  it("should handle TodoActivityNotFoundError with 404 status code", async () => {
    const context = createMockContext();
    const error = new TodoActivityNotFoundError("test-id");
    const next = createNextFunction(true, error);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.NOT_FOUND }) }, 404);
  });

  it("should handle InvalidStateTransitionError with 400 status code", async () => {
    const context = createMockContext();
    const error = new InvalidStateTransitionError("Cannot transition from COMPLETED to IN_PROGRESS");
    const next = createNextFunction(true, error);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).toHaveBeenCalledWith(
      { error: expect.objectContaining({ code: ErrorCode.INVALID_STATE }) },
      400,
    );
  });

  it("should handle UnauthorizedActivityDeletionError with 403 status code", async () => {
    const context = createMockContext();
    const error = new UnauthorizedActivityDeletionError("activity-1", "System activity cannot be deleted");
    const next = createNextFunction(true, error);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.FORBIDDEN }) }, 403);
  });

  it("should handle TagNameExistsError with 409 status code", async () => {
    const context = createMockContext();
    const error = new TagNameExistsError("test-name");
    const next = createNextFunction(true, error);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).toHaveBeenCalledWith({ error: expect.objectContaining({ code: ErrorCode.CONFLICT }) }, 409);
  });

  it("should handle validation errors with 400 status code", async () => {
    const context = createMockContext();
    const mockValiError = createValiErrorMock();
    const next = createNextFunction(true, mockValiError as Error);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).toHaveBeenCalledWith(
      {
        error: expect.objectContaining({ code: ErrorCode.VALIDATION_ERROR }),
        details: expect.any(Array),
      },
      400,
    );
  });

  it("should handle unknown errors with 500 status code", async () => {
    const context = createMockContext();
    const error = new Error("Unknown error");
    const next = createNextFunction(true, error);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).toHaveBeenCalledWith(
      { error: expect.objectContaining({ code: ErrorCode.INTERNAL_ERROR }) },
      500,
    );
  });

  it("should not handle errors when no error is thrown", async () => {
    const context = createMockContext();
    const next = createNextFunction(false);

    await errorHandler(context as unknown as Parameters<typeof errorHandler>[0], next);

    expect(context.json).not.toHaveBeenCalled();
  });
});
