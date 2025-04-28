import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createTestTodo } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetTodoWorkTimeUseCase } from "./get-todo-work-time";

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

describe("GetTodoWorkTimeUseCase", () => {
  const mockTodoRepository = {
    findAll: mock<() => Promise<Todo[]>>(() => Promise.resolve([])),
    findById: mock<(id: string) => Promise<Todo | null>>(() => Promise.resolve(null)),
    create: mock<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>(() =>
      Promise.resolve({} as Todo),
    ),
    update: mock<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>(() => Promise.resolve(null)),
    delete: mock<(id: string) => Promise<void>>(() => Promise.resolve()),
  } as MockedTodoRepository;

  let useCase: GetTodoWorkTimeUseCase;

  beforeEach(() => {
    useCase = new GetTodoWorkTimeUseCase(mockTodoRepository);
    // Clear mock calls between tests
    mockTodoRepository.findById.mockClear();
  });

  test("should calculate work time for active todo including current session", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();
    const startedAt = new Date(now.getTime() - 3600000); // 1 hour ago

    const mockTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      description: "Description",
      status: TodoStatus.PENDING,
      workState: WorkState.ACTIVE, // Active work state
      totalWorkTime: 7200, // Already 2 hours of work
      lastStateChangeAt: startedAt, // Started working 1 hour ago
      createdAt: new Date(now.getTime() - 86400000), // Created 1 day ago
      updatedAt: startedAt,
      priority: PriorityLevel.MEDIUM,
    });

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo));

    // Act
    const result = await useCase.execute(todoId);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(result.totalWorkTime).toBeGreaterThanOrEqual(10800); // Existing 2 hours + current session of about 1 hour
    expect(result.workState).toBe(WorkState.ACTIVE);
    expect(result.formattedTime).toMatch(/^3h \d+m$/); // Format "3h XXm"
  });

  test("should format work time correctly", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();

    // 異なる作業時間のmockTodoを作成
    const mockTodo1 = createTestTodo({
      id: todoId,
      title: "Test Todo 1",
      status: TodoStatus.PENDING,
      workState: WorkState.PAUSED,
      totalWorkTime: 30, // 30秒
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    });

    const mockTodo2 = createTestTodo({
      id: todoId,
      title: "Test Todo 2",
      status: TodoStatus.PENDING,
      workState: WorkState.PAUSED,
      totalWorkTime: 90, // 1分30秒
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.LOW,
    });

    const mockTodo3 = createTestTodo({
      id: todoId,
      title: "Test Todo 3",
      status: TodoStatus.PENDING,
      workState: WorkState.PAUSED,
      totalWorkTime: 3660, // 1時間1分
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.HIGH,
    });

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo1));

    // Act & Assert
    let result = await useCase.execute(todoId);
    expect(result.formattedTime).toBe("30s");

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo2));
    result = await useCase.execute(todoId);
    expect(result.formattedTime).toBe("1m 30s");

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo3));
    result = await useCase.execute(todoId);
    expect(result.formattedTime).toBe("1h 1m");
  });

  test("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    const todoId = "non-existent-id";
    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute(todoId)).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
  });
});
