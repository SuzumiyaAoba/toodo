import { beforeEach, describe, expect, mock, test } from "bun:test";
import {
  ActivityType,
  PriorityLevel,
  type Todo,
  type TodoActivity,
  type TodoId,
  TodoStatus,
  WorkState,
} from "@toodo/core";
import { createTestTodo } from "../../../domain/entities/test-helpers";
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
  findById: MockedFunction<(id: TodoId) => Promise<Todo | null>>;
  create: MockedFunction<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>;
  update: MockedFunction<(id: TodoId, todo: Partial<Todo>) => Promise<Todo | null>>;
  delete: MockedFunction<(id: TodoId) => Promise<void>>;
}

interface MockedTodoActivityRepository {
  findByTodoId: MockedFunction<(todoId: TodoId) => Promise<TodoActivity[]>>;
  findById: MockedFunction<(id: TodoId) => Promise<TodoActivity | null>>;
  create: MockedFunction<(activity: Omit<TodoActivity, "id" | "createdAt">) => Promise<TodoActivity>>;
  delete: MockedFunction<(id: TodoId) => Promise<void>>;
  updateWorkPeriod: MockedFunction<(id: TodoId, workPeriodId: string | null) => Promise<TodoActivity | null>>;
  findByWorkPeriodId: MockedFunction<(workPeriodId: string) => Promise<TodoActivity[]>>;
  findByDateRange: MockedFunction<(startDate: Date, endDate: Date) => Promise<TodoActivity[]>>;
  update: MockedFunction<(id: TodoId, todoActivity: Partial<TodoActivity>) => Promise<TodoActivity | null>>;
  getTotalWorkTime: MockedFunction<(todoId: TodoId) => Promise<number>>;
  findByWorkPeriod: MockedFunction<(workPeriodId: string) => Promise<TodoActivity[]>>;
}

describe("GetTodoActivityListUseCase", () => {
  let mockTodoRepository: MockedTodoRepository;
  let mockTodoActivityRepository: MockedTodoActivityRepository;
  let useCase: GetTodoActivityListUseCase;

  beforeEach(() => {
    mockTodoRepository = {
      findAll: mock<() => Promise<Todo[]>>(() => Promise.resolve([])),
      findById: mock<(id: TodoId) => Promise<Todo | null>>(() => Promise.resolve(null)),
      create: mock<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>(() =>
        Promise.resolve({} as Todo),
      ),
      update: mock<(id: TodoId, todo: Partial<Todo>) => Promise<Todo | null>>(() => Promise.resolve(null)),
      delete: mock<(id: TodoId) => Promise<void>>(() => Promise.resolve()),
    } as MockedTodoRepository;

    mockTodoActivityRepository = {
      findByTodoId: mock<(todoId: TodoId) => Promise<TodoActivity[]>>(() => Promise.resolve([])),
      findById: mock<(id: TodoId) => Promise<TodoActivity | null>>(() => Promise.resolve(null)),
      create: mock<(activity: Omit<TodoActivity, "id" | "createdAt">) => Promise<TodoActivity>>(() =>
        Promise.resolve({} as TodoActivity),
      ),
      delete: mock<(id: TodoId) => Promise<void>>(() => Promise.resolve()),
      updateWorkPeriod: mock<(id: TodoId, workPeriodId: string | null) => Promise<TodoActivity | null>>(() =>
        Promise.resolve(null),
      ),
      findByWorkPeriodId: mock<(workPeriodId: string) => Promise<TodoActivity[]>>(() => Promise.resolve([])),
      findByDateRange: mock<(startDate: Date, endDate: Date) => Promise<TodoActivity[]>>(() => Promise.resolve([])),
      update: mock<(id: TodoId, todoActivity: Partial<TodoActivity>) => Promise<TodoActivity | null>>(() =>
        Promise.resolve(null),
      ),
      getTotalWorkTime: mock<(todoId: TodoId) => Promise<number>>(() => Promise.resolve(0)),
      findByWorkPeriod: mock<(workPeriodId: string) => Promise<TodoActivity[]>>(() => Promise.resolve([])),
    } as MockedTodoActivityRepository;

    useCase = new GetTodoActivityListUseCase(mockTodoRepository, mockTodoActivityRepository);
  });

  test("should throw TodoNotFoundError when todo does not exist", async () => {
    const todoId = "non-existent-todo" as TodoId;
    mockTodoRepository.findById.mockImplementation(() => Promise.resolve(null));

    await expect(useCase.execute(todoId)).rejects.toThrow(TodoNotFoundError);
  });

  test("should return activities for a valid todo", async () => {
    const todo = createTestTodo({
      id: "test-todo" as TodoId,
      title: "Test Todo",
      description: "Test Description",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      priority: PriorityLevel.MEDIUM,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const activities: TodoActivity[] = [
      {
        id: "activity-1",
        todoId: todo.id,
        type: ActivityType.STARTED,
        createdAt: new Date(),
      },
      {
        id: "activity-2",
        todoId: todo.id,
        type: ActivityType.PAUSED,
        createdAt: new Date(),
      },
    ];

    mockTodoRepository.findById.mockImplementation(() => Promise.resolve(todo));
    mockTodoActivityRepository.findByTodoId.mockImplementation(() => Promise.resolve(activities));

    const result = await useCase.execute(todo.id);
    expect(result).toEqual(activities);
  });

  test("should return empty array when todo has no activities", async () => {
    const todo = createTestTodo({
      id: "test-todo" as TodoId,
      title: "Test Todo",
      description: "Test Description",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      priority: PriorityLevel.MEDIUM,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockTodoRepository.findById.mockImplementation(() => Promise.resolve(todo));
    mockTodoActivityRepository.findByTodoId.mockImplementation(() => Promise.resolve([]));

    const result = await useCase.execute(todo.id);
    expect(result).toEqual([]);
  });
});
