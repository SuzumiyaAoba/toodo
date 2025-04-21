import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { ActivityType, type TodoActivity } from "../../../domain/entities/todo-activity";
import {
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { DeleteTodoActivityUseCase } from "./delete-todo-activity";

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

describe("DeleteTodoActivityUseCase", () => {
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

  let useCase: DeleteTodoActivityUseCase;

  beforeEach(() => {
    useCase = new DeleteTodoActivityUseCase(mockTodoRepository, mockTodoActivityRepository);
    // Clear mock calls between tests
    mockTodoRepository.findById.mockClear();
    mockTodoActivityRepository.findById.mockClear();
    mockTodoActivityRepository.delete.mockClear();
  });

  test("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    const todoId = "non-existent-id";
    const activityId = "activity-id";
    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute(todoId, activityId)).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoActivityRepository.findById).not.toHaveBeenCalled();
    expect(mockTodoActivityRepository.delete).not.toHaveBeenCalled();
  });

  test("should throw TodoActivityNotFoundError when activity does not exist", async () => {
    // Arrange
    const todoId = "todo-id";
    const activityId = "non-existent-activity";
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
    mockTodoActivityRepository.findById.mockImplementationOnce(async () => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute(todoId, activityId)).rejects.toThrow(TodoActivityNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.findById).toHaveBeenCalledWith(activityId);
    expect(mockTodoActivityRepository.delete).not.toHaveBeenCalled();
  });

  test("should throw UnauthorizedActivityDeletionError when activity belongs to different todo", async () => {
    // Arrange
    const todoId = "todo-id";
    const wrongTodoId = "wrong-todo-id";
    const activityId = "activity-id";
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

    const mockActivity: TodoActivity = {
      id: activityId,
      todoId: wrongTodoId, // Activity belongs to a different todo
      type: ActivityType.STARTED,
      workTime: undefined,
      previousState: undefined,
      note: undefined,
      createdAt: now,
    };

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo));
    mockTodoActivityRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockActivity));

    // Act & Assert
    await expect(useCase.execute(todoId, activityId)).rejects.toThrow(UnauthorizedActivityDeletionError);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.delete).not.toHaveBeenCalled();
  });

  test("should delete activity successfully", async () => {
    // Arrange
    const todoId = "todo-id";
    const activityId = "activity-id";
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

    const mockActivity: TodoActivity = {
      id: activityId,
      todoId: todoId, // Correct todo ID
      type: ActivityType.STARTED,
      workTime: undefined,
      previousState: undefined,
      note: undefined,
      createdAt: now,
    };

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo));
    mockTodoActivityRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockActivity));

    // Act
    await useCase.execute(todoId, activityId);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.delete).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.delete).toHaveBeenCalledWith(activityId);
  });
});
