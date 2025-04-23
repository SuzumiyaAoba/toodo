import { beforeEach, describe, expect, mock, test } from "bun:test";
import { PriorityLevel, type Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { UpdateTodoUseCase } from "./update-todo";

// モック関数の型を拡張
type MockedFunction<T extends (...args: any[]) => any> = {
  [K in keyof ReturnType<typeof mock<T>>]: ReturnType<typeof mock<T>>[K];
} & T;

// モック化されたリポジトリの型
interface MockedTodoRepository extends TodoRepository {
  findAll: MockedFunction<() => Promise<Todo[]>>;
  findById: MockedFunction<(id: string) => Promise<Todo | null>>;
  create: MockedFunction<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>;
  update: MockedFunction<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
}

describe("UpdateTodoUseCase", () => {
  const mockTodoRepository = {
    update: mock<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>(() => Promise.resolve(null)),
  } as MockedTodoRepository;

  let useCase: UpdateTodoUseCase;

  beforeEach(() => {
    useCase = new UpdateTodoUseCase(mockTodoRepository);
    // Clear mock calls between tests
    mockTodoRepository.update.mockClear();
  });

  test("should update a todo successfully", async () => {
    // Arrange
    const todoId = "todo-id";
    const updateData = {
      title: "Updated Title",
      description: "Updated Description",
    };

    const now = new Date();
    const updatedTodo = {
      id: todoId,
      title: "Updated Title",
      description: "Updated Description",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    };

    mockTodoRepository.update.mockImplementationOnce(async () => Promise.resolve(updatedTodo));

    // Act
    const result = await useCase.execute(todoId, updateData);

    // Assert
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, updateData);
    expect(result).toEqual(updatedTodo);
  });

  test("should update only specified fields", async () => {
    // Arrange
    const todoId = "todo-id";
    const updateData = {
      title: "Updated Title",
      // descriptionは更新しない
    };

    const now = new Date();
    const updatedTodo = {
      id: todoId,
      title: "Updated Title",
      description: "Original Description", // 変更されていない
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    };

    mockTodoRepository.update.mockImplementationOnce(async () => Promise.resolve(updatedTodo));

    // Act
    const result = await useCase.execute(todoId, updateData);

    // Assert
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, {
      title: "Updated Title",
    });
    expect(result).toEqual(updatedTodo);
    expect(result.description).toBe("Original Description");
  });

  test("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    const todoId = "non-existent-id";
    const updateData = {
      title: "Updated Title",
    };

    mockTodoRepository.update.mockImplementationOnce(async () => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute(todoId, updateData)).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, updateData);
  });
});
