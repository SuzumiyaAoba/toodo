import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import {
  createMockPrismaTodo,
  createTestTodo,
  priorityLevelToString,
  todoStatusToString,
  workStateToString,
} from "../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../domain/entities/todo";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { Prisma, PrismaClient } from "../../generated/prisma";
import type { DefaultArgs } from "../../generated/prisma/runtime/library";
import { MockedFunction } from "../../test/types";
import { PrismaTodoRepository } from "./prisma-todo-repository";

// Prismaの型定義
type TodoCreateInput = Prisma.TodoCreateInput;
type TodoUpdateInput = Prisma.TodoUpdateInput;
type TodoFindUniqueArgs = Prisma.TodoFindUniqueArgs;
type TodoFindManyArgs = Prisma.TodoFindManyArgs;
type TodoWhereUniqueInput = Prisma.TodoWhereUniqueInput;
type TodoWhereInput = Prisma.TodoWhereInput;
type TodoDeleteArgs = Prisma.TodoDeleteArgs;

// モックデータ型定義
type MockTodoData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  workState: string;
  totalWorkTime: number;
  lastStateChangeAt: Date;
  createdAt: Date;
  updatedAt: Date;
  priority: string;
  projectId: string | null;
};

// モック化されたPrismaClientの型
interface MockedPrismaClient {
  todo: {
    findMany: MockedFunction<(args?: TodoFindManyArgs) => Promise<MockTodoData[]>>;
    findUnique: MockedFunction<(args: TodoFindUniqueArgs) => Promise<MockTodoData | null>>;
    create: MockedFunction<(args: { data: TodoCreateInput }) => Promise<MockTodoData>>;
    update: MockedFunction<(args: { where: TodoWhereUniqueInput; data: TodoUpdateInput }) => Promise<MockTodoData>>;
    delete: MockedFunction<(args: TodoDeleteArgs) => Promise<MockTodoData>>;
  };
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
}

describe("PrismaTodoRepository", () => {
  // Mock Prisma client with better typing
  const findMany = mock<(args?: TodoFindManyArgs) => Promise<MockTodoData[]>>();
  const findUnique = mock<(args: TodoFindUniqueArgs) => Promise<MockTodoData | null>>();
  const create = mock<(args: { data: TodoCreateInput }) => Promise<MockTodoData>>();
  const update = mock<(args: { where: TodoWhereUniqueInput; data: TodoUpdateInput }) => Promise<MockTodoData>>();
  const deleteMethod = mock<(args: TodoDeleteArgs) => Promise<MockTodoData>>();

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
      const mockTodos: MockTodoData[] = [
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
          priority: "medium",
          projectId: null,
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
          priority: "high",
          projectId: null,
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
      expect(result[0].priority).toBe(PriorityLevel.MEDIUM);
      expect(result[1].id).toBe("todo-2");
      expect(result[1].status).toBe(TodoStatus.COMPLETED);
      expect(result[1].priority).toBe(PriorityLevel.HIGH);
    });
  });

  describe("findById", () => {
    test("should return todo by id", async () => {
      // Arrange
      const now = new Date();
      const mockTodo: MockTodoData = {
        id: "todo-1",
        title: "Todo 1",
        description: "Description 1",
        status: "pending",
        workState: "idle",
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
        priority: "low",
        projectId: null,
      };
      findUnique.mockImplementationOnce(async () => Promise.resolve(mockTodo));

      // Act
      const result = await repository.findById("todo-1");

      // Assert
      expect(findUnique).toHaveBeenCalledTimes(1);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: "todo-1" },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      expect(result?.id).toBe("todo-1");
      expect(result?.title).toBe("Todo 1");
      expect(result?.priority).toBe(PriorityLevel.LOW);
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
      const newTodo = Todo.createNew({
        title: "New Todo",
        description: "New Description",
        status: TodoStatus.PENDING,
        workState: WorkState.IDLE,
        totalWorkTime: 0,
        lastStateChangeAt: now,
        priority: PriorityLevel.HIGH,
      });

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
        priority: "high",
        projectId: null,
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
          priority: "high",
        },
        include: {
          dependsOn: true,
          dependents: true,
        },
      });
      expect(result.id).toBe("new-todo-id");
      expect(result.priority).toBe(PriorityLevel.HIGH);
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
        priority: PriorityLevel.MEDIUM,
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
        priority: "low",
        projectId: null,
      };

      const updatedTodo = {
        ...existingTodo,
        title: "Updated Title",
        description: "Updated Description",
        priority: "medium",
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
      expect(result?.priority).toBe(PriorityLevel.MEDIUM);
    });

    test("should return null when todo not found", async () => {
      // Arrange
      findUnique.mockImplementationOnce(async () => Promise.resolve(null));

      // Act
      const result = await repository.update("non-existent", {
        title: "New Title",
      });

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
      const now = new Date();
      const existingTodo: MockTodoData = {
        id: todoId,
        title: "Todo to delete",
        description: null,
        status: "pending",
        workState: "idle",
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
        priority: "medium",
        projectId: null,
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
      let errorThrown = false;
      try {
        await repository.delete("non-existent");
      } catch (error) {
        errorThrown = true;
        // エラーオブジェクトの型をアサーション
        const err = error as TodoNotFoundError;
        expect(err.name).toBe("TodoNotFoundError");
        expect(err.message).toContain("non-existent");
      }

      // エラーがスローされたことを確認
      expect(errorThrown).toBe(true);

      // deleteメソッドが呼ばれていないことを確認
      expect(deleteMethod).not.toHaveBeenCalled();
    });
  });
});
