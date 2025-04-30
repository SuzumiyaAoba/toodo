import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { TodoActivity } from "@toodo/core";
import { ActivityType } from "@toodo/core";
import { PriorityLevel, type Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { DeleteTodoUseCase } from "./delete-todo";

// モック関数の型を拡張
type MockedFunction<T extends (...args: any) => any> = {
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

interface MockedTodoActivityRepository extends TodoActivityRepository {
  findByTodoId: MockedFunction<(todoId: string) => Promise<TodoActivity[]>>;
  findById: MockedFunction<(id: string) => Promise<TodoActivity | null>>;
  create: MockedFunction<(activity: Omit<TodoActivity, "id" | "createdAt">) => Promise<TodoActivity>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
}

describe("DeleteTodoUseCase", () => {
  const mockTodoRepository = {
    findAll: mock<() => Promise<Todo[]>>(() => Promise.resolve([])),
    findById: mock<(id: string) => Promise<Todo | null>>(() => Promise.resolve(null)),
    create: mock<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>(() =>
      Promise.resolve({} as Todo),
    ),
    update: mock<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>(() => Promise.resolve(null)),
    delete: mock<(id: string) => Promise<void>>(() => Promise.resolve()),
  } as MockedTodoRepository;

  const mockTodoActivityRepository = {
    findByTodoId: mock<(todoId: string) => Promise<TodoActivity[]>>(() => Promise.resolve([])),
    findById: mock<(id: string) => Promise<TodoActivity | null>>(() => Promise.resolve(null)),
    create: mock<(activity: Omit<TodoActivity, "id" | "createdAt">) => Promise<TodoActivity>>(() =>
      Promise.resolve({} as TodoActivity),
    ),
    delete: mock<(id: string) => Promise<void>>(() => Promise.resolve()),
  } as MockedTodoActivityRepository;

  let useCase: DeleteTodoUseCase;

  beforeEach(() => {
    useCase = new DeleteTodoUseCase(mockTodoRepository, mockTodoActivityRepository);
    // Clear mock calls between tests
    mockTodoActivityRepository.create.mockClear();
    mockTodoRepository.delete.mockClear();
  });

  test("should create a discarded activity and delete the todo", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();

    const createdActivity: TodoActivity = {
      id: "activity-id",
      todoId,
      type: ActivityType.DISCARDED,
      workTime: undefined,
      previousState: WorkState.IDLE,
      note: "Todo discarded",
      createdAt: now,
    };

    mockTodoActivityRepository.create.mockImplementationOnce(async () => Promise.resolve(createdActivity));

    // Act
    await useCase.execute(todoId);

    // Assert
    expect(mockTodoActivityRepository.create).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.create).toHaveBeenCalledWith({
      todoId,
      type: ActivityType.DISCARDED,
      previousState: undefined, // この値は実行時に内部で決定される
      workTime: undefined,
      note: expect.any(String),
    });

    expect(mockTodoRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.delete).toHaveBeenCalledWith(todoId);
  });
});
