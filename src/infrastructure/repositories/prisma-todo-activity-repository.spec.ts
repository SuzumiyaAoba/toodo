import { beforeEach, describe, expect, mock, test } from "bun:test";
import { WorkState } from "../../domain/entities/todo";
import { ActivityType, type TodoActivity } from "../../domain/entities/todo-activity";
import { TodoActivityNotFoundError } from "../../domain/errors/todo-errors";
import type { PrismaClient } from "../../generated/prisma";
import type { DefaultArgs, PrismaClientOptions } from "../../generated/prisma/runtime/library";
import { PrismaTodoActivityRepository } from "./prisma-todo-activity-repository";

// モック関数の型を拡張
type MockedFunction<T extends (...args: unknown[]) => unknown> = {
  [K in keyof ReturnType<typeof mock<T>>]: ReturnType<typeof mock<T>>[K];
} & T;

// モック化されたPrismaClientの型
interface MockedPrismaClient {
  todoActivity: {
    findMany: MockedFunction<(args: unknown) => Promise<unknown[]>>;
    findUnique: MockedFunction<(args: unknown) => Promise<unknown | null>>;
    create: MockedFunction<(args: unknown) => Promise<unknown>>;
    delete: MockedFunction<(args: unknown) => Promise<unknown>>;
    findUniqueOrThrow: MockedFunction<(args: unknown) => Promise<unknown>>;
    findFirst: MockedFunction<(args: unknown) => Promise<unknown | null>>;
    findFirstOrThrow: MockedFunction<(args: unknown) => Promise<unknown>>;
    createMany: MockedFunction<(args: unknown) => Promise<unknown>>;
    updateMany: MockedFunction<(args: unknown) => Promise<unknown>>;
    deleteMany: MockedFunction<(args: unknown) => Promise<unknown>>;
    count: MockedFunction<(args: unknown) => Promise<number>>;
    aggregate: MockedFunction<(args: unknown) => Promise<unknown>>;
    groupBy: MockedFunction<(args: unknown) => Promise<unknown>>;
    update: MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  todo: {
    findMany: MockedFunction<(args: unknown) => Promise<unknown[]>>;
    findUnique: MockedFunction<(args: unknown) => Promise<unknown | null>>;
    create: MockedFunction<(args: unknown) => Promise<unknown>>;
    update: MockedFunction<(args: unknown) => Promise<unknown>>;
    delete: MockedFunction<(args: unknown) => Promise<unknown>>;
    findUniqueOrThrow: MockedFunction<(args: unknown) => Promise<unknown>>;
    findFirst: MockedFunction<(args: unknown) => Promise<unknown | null>>;
    findFirstOrThrow: MockedFunction<(args: unknown) => Promise<unknown>>;
    createMany: MockedFunction<(args: unknown) => Promise<unknown>>;
    updateMany: MockedFunction<(args: unknown) => Promise<unknown>>;
    deleteMany: MockedFunction<(args: unknown) => Promise<unknown>>;
    count: MockedFunction<(args: unknown) => Promise<number>>;
    aggregate: MockedFunction<(args: unknown) => Promise<unknown>>;
    groupBy: MockedFunction<(args: unknown) => Promise<unknown>>;
  };
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $transaction: <T>(fn: (prisma: PrismaClient) => Promise<T>) => Promise<T>;
  $on: (eventType: string, callback: (event: unknown) => void) => void;
  $use: (callback: (params: unknown, next: (params: unknown) => Promise<unknown>) => Promise<unknown>) => void;
  $executeRaw: (query: unknown, ...values: unknown[]) => Promise<number>;
  $executeRawUnsafe: (query: string, ...values: unknown[]) => Promise<number>;
  $queryRaw: (query: unknown, ...values: unknown[]) => Promise<unknown>;
  $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<unknown>;
  $extends: unknown;
}

describe("PrismaTodoActivityRepository", () => {
  // Mock Prisma client with better typing
  const findMany = mock<(args: unknown) => Promise<unknown[]>>();
  const findUnique = mock<(args: unknown) => Promise<unknown | null>>();
  const create = mock<(args: unknown) => Promise<unknown>>();
  const deleteMethod = mock<(args: unknown) => Promise<unknown>>();

  const mockPrisma = {
    todoActivity: {
      findMany,
      findUnique,
      create,
      delete: deleteMethod,
    },
  } as unknown as PrismaClient;

  let repository: PrismaTodoActivityRepository;

  beforeEach(() => {
    repository = new PrismaTodoActivityRepository(mockPrisma);
    // Clear mock calls between tests
    findMany.mockClear();
    findUnique.mockClear();
    create.mockClear();
    deleteMethod.mockClear();
  });

  describe("findByTodoId", () => {
    test("should return activities for a todo", async () => {
      // Arrange
      const todoId = "todo-1";
      const now = new Date();
      const mockActivities = [
        {
          id: "activity-1",
          todoId,
          type: "started",
          workTime: null,
          previousState: "idle",
          note: "Started work",
          createdAt: now,
        },
        {
          id: "activity-2",
          todoId,
          type: "paused",
          workTime: 120,
          previousState: "active",
          note: "Taking a break",
          createdAt: new Date(now.getTime() + 3600000),
        },
      ];
      findMany.mockImplementationOnce(async () => Promise.resolve(mockActivities));

      // Act
      const result = await repository.findByTodoId(todoId);

      // Assert
      expect(findMany).toHaveBeenCalledTimes(1);
      expect(findMany).toHaveBeenCalledWith({
        where: { todoId },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("activity-1");
      expect(result[0].type).toBe(ActivityType.STARTED);
      expect(result[1].id).toBe("activity-2");
      expect(result[1].workTime).toBe(120);
    });

    test("should return empty array when no activities exist", async () => {
      // Arrange
      findMany.mockImplementationOnce(async () => Promise.resolve([]));

      // Act
      const result = await repository.findByTodoId("todo-id");

      // Assert
      expect(findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    test("should return activity by id", async () => {
      // Arrange
      const now = new Date();
      const mockActivity = {
        id: "activity-1",
        todoId: "todo-1",
        type: "started",
        workTime: null,
        previousState: "idle",
        note: "Started work",
        createdAt: now,
      };
      findUnique.mockImplementationOnce(async () => Promise.resolve(mockActivity));

      // Act
      const result = await repository.findById("activity-1");

      // Assert
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(findUnique).toHaveBeenCalledWith({ where: { id: "activity-1" } });
      expect(result?.id).toBe("activity-1");
      expect(result?.type).toBe(ActivityType.STARTED);
    });

    test("should return null when activity not found", async () => {
      // Arrange
      findUnique.mockImplementationOnce(async () => Promise.resolve(null));

      // Act
      const result = await repository.findById("non-existent");

      // Assert
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("should create new activity", async () => {
      // Arrange
      const now = new Date();
      const newActivity = {
        todoId: "todo-1",
        type: ActivityType.STARTED,
        workTime: undefined,
        previousState: WorkState.IDLE,
        note: "Starting work",
      };

      const createdActivity = {
        id: "new-activity-id",
        todoId: "todo-1",
        type: "started",
        workTime: null,
        previousState: "idle",
        note: "Starting work",
        createdAt: now,
      };

      create.mockImplementationOnce(async () => Promise.resolve(createdActivity));

      // Act
      const result = await repository.create(newActivity);

      // Assert
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith({
        data: {
          todoId: "todo-1",
          type: "started",
          workTime: undefined,
          previousState: "idle",
          note: "Starting work",
        },
      });
      expect(result.id).toBe("new-activity-id");
      expect(result.todoId).toBe("todo-1");
    });
  });

  describe("delete", () => {
    test("should delete activity", async () => {
      // Arrange
      const activityId = "activity-1";
      const existingActivity = {
        id: activityId,
        todoId: "todo-1",
        type: "started",
      };

      findUnique.mockImplementationOnce(async () => Promise.resolve(existingActivity));

      // Act
      await repository.delete(activityId);

      // Assert
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(deleteMethod).toHaveBeenCalledTimes(1);
      expect(deleteMethod).toHaveBeenCalledWith({ where: { id: activityId } });
    });

    test("should throw error when activity not found", async () => {
      // Arrange
      findUnique.mockImplementationOnce(async () => Promise.resolve(null));

      // Act & Assert
      try {
        await repository.delete("non-existent");
        // エラーがスローされないなら、テストを失敗させる
        fail("Expected TodoActivityNotFoundError to be thrown");
      } catch (error) {
        // エラーの種類を確認
        expect(error.name).toBe("TodoActivityNotFoundError");
        expect(error.message).toContain("non-existent");
      }

      // deleteメソッドが呼ばれていないことを確認
      expect(deleteMethod).not.toHaveBeenCalled();
    });
  });
});
