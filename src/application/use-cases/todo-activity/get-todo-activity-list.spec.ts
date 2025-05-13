import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { ActivityType, type TodoActivity } from "../../../domain/entities/todo-activity";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetTodoActivityListUseCase } from "./get-todo-activity-list";

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

interface MockedTodoActivityRepository extends TodoActivityRepository {
  findByTodoId: MockedFunction<(todoId: string) => Promise<TodoActivity[]>>;
  findById: MockedFunction<(id: string) => Promise<TodoActivity | null>>;
  create: MockedFunction<(activity: Omit<TodoActivity, "id" | "createdAt">) => Promise<TodoActivity>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
}

describe("GetTodoActivityListUseCase", () => {
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

  let useCase: GetTodoActivityListUseCase;

  beforeEach(() => {
    useCase = new GetTodoActivityListUseCase(mockTodoRepository, mockTodoActivityRepository);
    // Clear mock calls between tests
    mockTodoRepository.findById.mockClear();
    mockTodoActivityRepository.findByTodoId.mockClear();
  });

  test("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    const todoId = "non-existent-id";
    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute(todoId)).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoActivityRepository.findByTodoId).not.toHaveBeenCalled();
  });

  test("should return activities for a todo", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();

    const mockTodo: Todo = {
      id: todoId,
      title: "Test Todo",
      description: undefined,
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const mockActivities: TodoActivity[] = [
      {
        id: "activity-1",
        todoId,
        type: ActivityType.STARTED,
        workTime: undefined,
        previousState: WorkState.IDLE,
        note: "Started work",
        createdAt: now,
      },
      {
        id: "activity-2",
        todoId,
        type: ActivityType.PAUSED,
        workTime: 120,
        previousState: WorkState.ACTIVE,
        note: "Taking a break",
        createdAt: new Date(now.getTime() + 3600000),
      },
    ];

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo));
    mockTodoActivityRepository.findByTodoId.mockImplementationOnce(async () => Promise.resolve(mockActivities));

    // Act
    const result = await useCase.execute(todoId);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.findByTodoId).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.findByTodoId).toHaveBeenCalledWith(todoId);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("activity-1");
    expect(result[1].id).toBe("activity-2");
  });

  test("should return empty array when todo has no activities", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();

    const mockTodo: Todo = {
      id: todoId,
      title: "Test Todo",
      description: undefined,
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
    };

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo));
    mockTodoActivityRepository.findByTodoId.mockImplementationOnce(async () => Promise.resolve([]));

    // Act
    const result = await useCase.execute(todoId);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.findByTodoId).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
