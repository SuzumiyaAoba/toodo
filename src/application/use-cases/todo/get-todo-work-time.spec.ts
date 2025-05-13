import { beforeEach, describe, expect, mock, test } from "bun:test";
import { PriorityLevel, type Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
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

  test("should get todo work time information", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();
    const startedAt = new Date(now.getTime() - 3600000); // 1時間前

    const mockTodo: Todo = {
      id: todoId,
      title: "Test Todo",
      description: "Description",
      status: TodoStatus.PENDING,
      workState: WorkState.ACTIVE, // 作業中の状態
      totalWorkTime: 7200, // 既に2時間の作業あり
      lastStateChangeAt: startedAt, // 1時間前に作業開始
      createdAt: new Date(now.getTime() - 86400000), // 1日前に作成
      updatedAt: startedAt,
      priority: PriorityLevel.MEDIUM,
    };

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo));

    // Act
    const result = await useCase.execute(todoId);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(result.totalWorkTime).toBeGreaterThanOrEqual(10800); // 既存の2時間 + 現在進行中の約1時間
    expect(result.workState).toBe(WorkState.ACTIVE);
    expect(result.formattedTime).toMatch(/^3h \d+m$/); // "3h XXm" 形式
  });

  test("should format work time correctly", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();

    // 異なる作業時間のmockTodoを作成
    const mockTodo1: Todo = {
      id: todoId,
      title: "Test Todo 1",
      description: undefined,
      status: TodoStatus.PENDING,
      workState: WorkState.PAUSED,
      totalWorkTime: 30, // 30秒
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    };

    const mockTodo2: Todo = {
      id: todoId,
      title: "Test Todo 2",
      description: undefined,
      status: TodoStatus.PENDING,
      workState: WorkState.PAUSED,
      totalWorkTime: 90, // 1分30秒
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.LOW,
    };

    const mockTodo3: Todo = {
      id: todoId,
      title: "Test Todo 3",
      description: undefined,
      status: TodoStatus.PENDING,
      workState: WorkState.PAUSED,
      totalWorkTime: 3660, // 1時間1分
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.HIGH,
    };

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
