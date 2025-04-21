import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { type Todo, TodoStatus, WorkState } from "../../domain/entities/todo";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { Prisma, PrismaClient } from "../../generated/prisma";
import type { DefaultArgs, PrismaClientOptions } from "../../generated/prisma/runtime/library";
import { PrismaTodoRepository } from "./prisma-todo-repository";

// モック関数の型を拡張
type MockedFunction<T extends (...args: any) => any> = {
  [K in keyof ReturnType<typeof mock<T>>]: ReturnType<typeof mock<T>>[K];
} & T;

// モック化されたPrismaClientの型
interface MockedPrismaClient {
  todo: {
    findMany: MockedFunction<() => Promise<any[]>>;
    findUnique: MockedFunction<(args: any) => Promise<any | null>>;
    create: MockedFunction<(args: any) => Promise<any>>;
    update: MockedFunction<(args: any) => Promise<any>>;
    delete: MockedFunction<(args: any) => Promise<any>>;
    findUniqueOrThrow: MockedFunction<(args: any) => Promise<any>>;
    findFirst: MockedFunction<(args: any) => Promise<any | null>>;
    findFirstOrThrow: MockedFunction<(args: any) => Promise<any>>;
    createMany: MockedFunction<(args: any) => Promise<any>>;
    updateMany: MockedFunction<(args: any) => Promise<any>>;
    deleteMany: MockedFunction<(args: any) => Promise<any>>;
    count: MockedFunction<(args: any) => Promise<number>>;
    aggregate: MockedFunction<(args: any) => Promise<any>>;
    groupBy: MockedFunction<(args: any) => Promise<any>>;
  };
  todoActivity: {
    findMany: MockedFunction<(args: any) => Promise<any[]>>;
    findUnique: MockedFunction<(args: any) => Promise<any | null>>;
    create: MockedFunction<(args: any) => Promise<any>>;
    delete: MockedFunction<(args: any) => Promise<any>>;
    update: MockedFunction<(args: any) => Promise<any>>;
    findUniqueOrThrow: MockedFunction<(args: any) => Promise<any>>;
    findFirst: MockedFunction<(args: any) => Promise<any | null>>;
    findFirstOrThrow: MockedFunction<(args: any) => Promise<any>>;
    createMany: MockedFunction<(args: any) => Promise<any>>;
    updateMany: MockedFunction<(args: any) => Promise<any>>;
    deleteMany: MockedFunction<(args: any) => Promise<any>>;
    count: MockedFunction<(args: any) => Promise<number>>;
    aggregate: MockedFunction<(args: any) => Promise<any>>;
    groupBy: MockedFunction<(args: any) => Promise<any>>;
  };
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $transaction: <T>(fn: (prisma: PrismaClient) => Promise<T>) => Promise<T>;
  $on: (eventType: string, callback: (event: any) => void) => void;
  $use: (callback: (params: any, next: (params: any) => Promise<any>) => Promise<any>) => void;
  $executeRaw: (query: any, ...values: any[]) => Promise<number>;
  $executeRawUnsafe: (query: string, ...values: any[]) => Promise<number>;
  $queryRaw: (query: any, ...values: any[]) => Promise<any>;
  $queryRawUnsafe: (query: string, ...values: any[]) => Promise<any>;
  $extends: any;
}

describe("PrismaTodoRepository", () => {
  // Mock Prisma client with better typing
  const findMany = mock<() => Promise<any[]>>();
  const findUnique = mock<(args: any) => Promise<any | null>>();
  const create = mock<(args: any) => Promise<any>>();
  const update = mock<(args: any) => Promise<any>>();
  const deleteMethod = mock<(args: any) => Promise<any>>();

  const mockPrisma = {
    todo: {
      findMany,
      findUnique,
      create,
      update,
      delete: deleteMethod,
    },
  } as unknown as PrismaClient;

  let repository: PrismaTodoRepository;

  beforeEach(() => {
    repository = new PrismaTodoRepository(mockPrisma);
    // Clear mock calls between tests
    findMany.mockClear();
    findUnique.mockClear();
    create.mockClear();
    update.mockClear();
    deleteMethod.mockClear();
  });

  describe("findAll", () => {
    test("should return all todos", async () => {
      // Arrange
      const now = new Date();
      const mockTodos = [
        {
          id: "todo-1",
          title: "Todo 1",
          description: "Description 1",
          status: "pending",
          workState: "idle",
          totalWorkTime: 0,
          lastStateChangeAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "todo-2",
          title: "Todo 2",
          description: null,
          status: "completed",
          workState: "completed",
          totalWorkTime: 120,
          lastStateChangeAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ];
      findMany.mockImplementationOnce(async () => Promise.resolve(mockTodos));

      // Act
      const result = await repository.findAll();

      // Assert
      expect(findMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("todo-1");
      expect(result[0].status).toBe(TodoStatus.PENDING);
      expect(result[1].id).toBe("todo-2");
      expect(result[1].status).toBe(TodoStatus.COMPLETED);
    });
  });

  describe("findById", () => {
    test("should return todo by id", async () => {
      // Arrange
      const now = new Date();
      const mockTodo = {
        id: "todo-1",
        title: "Todo 1",
        description: "Description 1",
        status: "pending",
        workState: "idle",
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
      };
      findUnique.mockImplementationOnce(async () => Promise.resolve(mockTodo));

      // Act
      const result = await repository.findById("todo-1");

      // Assert
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(findUnique).toHaveBeenCalledWith({ where: { id: "todo-1" } });
      expect(result?.id).toBe("todo-1");
      expect(result?.title).toBe("Todo 1");
    });

    test("should return null when todo not found", async () => {
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
    test("should create new todo", async () => {
      // Arrange
      const now = new Date();
      const newTodo = {
        title: "New Todo",
        description: "New Description",
        status: TodoStatus.PENDING,
        workState: WorkState.IDLE,
        totalWorkTime: 0,
        lastStateChangeAt: now,
      };

      const createdTodo = {
        id: "new-todo-id",
        title: "New Todo",
        description: "New Description",
        status: "pending",
        workState: "idle",
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
      };

      create.mockImplementationOnce(async () => Promise.resolve(createdTodo));

      // Act
      const result = await repository.create(newTodo);

      // Assert
      expect(create).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledWith({
        data: {
          title: "New Todo",
          description: "New Description",
          status: "pending",
          workState: "idle",
          totalWorkTime: 0,
          lastStateChangeAt: now,
        },
      });
      expect(result.id).toBe("new-todo-id");
    });
  });

  describe("update", () => {
    test("should update existing todo", async () => {
      // Arrange
      const now = new Date();
      const todoId = "todo-1";
      const updateData = {
        title: "Updated Title",
        description: "Updated Description",
      };

      const existingTodo = {
        id: todoId,
        title: "Old Title",
        description: "Old Description",
        status: "pending",
        workState: "idle",
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
      };

      const updatedTodo = {
        ...existingTodo,
        title: "Updated Title",
        description: "Updated Description",
      };

      findUnique.mockImplementationOnce(async () => Promise.resolve(existingTodo));
      update.mockImplementationOnce(async () => Promise.resolve(updatedTodo));

      // Act
      const result = await repository.update(todoId, updateData);

      // Assert
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledTimes(1);
      expect(result?.title).toBe("Updated Title");
      expect(result?.description).toBe("Updated Description");
    });

    test("should return null when todo not found", async () => {
      // Arrange
      findUnique.mockImplementationOnce(async () => Promise.resolve(null));

      // Act
      const result = await repository.update("non-existent", { title: "New Title" });

      // Assert
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("should delete todo", async () => {
      // Arrange
      const todoId = "todo-1";
      const existingTodo = {
        id: todoId,
        title: "Todo to delete",
      };

      findUnique.mockImplementationOnce(async () => Promise.resolve(existingTodo));

      // Act
      await repository.delete(todoId);

      // Assert
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(deleteMethod).toHaveBeenCalledTimes(1);
      expect(deleteMethod).toHaveBeenCalledWith({ where: { id: todoId } });
    });

    test("should throw error when todo not found", async () => {
      // Arrange
      findUnique.mockImplementationOnce(async () => Promise.resolve(null));

      // Act & Assert
      try {
        await repository.delete("non-existent");
        // エラーがスローされないなら、テストを失敗させる
        fail("Expected TodoNotFoundError to be thrown");
      } catch (error) {
        // インスタンスチェックの代わりに、instanceof演算子を使用せずエラーの種類を確認
        expect(error.name).toBe("TodoNotFoundError");
        expect(error.message).toContain("non-existent");
      }

      // deleteメソッドが呼ばれていないことを確認
      expect(deleteMethod).not.toHaveBeenCalled();
    });
  });
});
