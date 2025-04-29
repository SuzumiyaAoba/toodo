import { beforeEach, describe, expect, mock, test } from "bun:test";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "@toodo/core/dist/domain/entities/todo";
import { ActivityType } from "@toodo/core/dist/domain/entities/todo-activity";
import type { TodoActivity } from "@toodo/core/dist/domain/entities/todo-activity";
import type { TodoRepository } from "@toodo/core/dist/domain/repositories/todo-repository";
import { createTestTodo } from "../../../domain/entities/test-helpers";
import {
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
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
  update: MockedFunction<
    (id: string, todo: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">>) => Promise<Todo | null>
  >;
  delete: MockedFunction<(id: string) => Promise<void>>;
  findByStatus: MockedFunction<(status: string) => Promise<Todo[]>>;
  findByPriority: MockedFunction<(priority: string) => Promise<Todo[]>>;
  findByProject: MockedFunction<(projectId: string) => Promise<Todo[]>>;
  findByTag: MockedFunction<(tagId: string) => Promise<Todo[]>>;
  findByDependency: MockedFunction<(dependencyId: string) => Promise<Todo[]>>;
  findByDependent: MockedFunction<(dependentId: string) => Promise<Todo[]>>;
  findWithDueDateBefore: MockedFunction<(date: Date) => Promise<Todo[]>>;
  findWithDueDateBetween: MockedFunction<(startDate: Date, endDate: Date) => Promise<Todo[]>>;
  findByParent: MockedFunction<(parentId: string) => Promise<Todo[]>>;
  findChildrenTree: MockedFunction<(parentId: string, maxDepth?: number) => Promise<Todo[]>>;
  updateParent: MockedFunction<(todoId: string, parentId: string | null) => Promise<Todo>>;
  addSubtask: MockedFunction<(parentId: string, subtaskId: string) => Promise<void>>;
  removeSubtask: MockedFunction<(parentId: string, subtaskId: string) => Promise<void>>;
  checkForHierarchyCycle: MockedFunction<(todoId: string, potentialParentId: string) => Promise<boolean>>;
  addDependency: MockedFunction<(todoId: string, dependencyId: string) => Promise<void>>;
  removeDependency: MockedFunction<(todoId: string, dependencyId: string) => Promise<void>>;
  findDependencies: MockedFunction<(todoId: string) => Promise<Todo[]>>;
  findDependents: MockedFunction<(todoId: string) => Promise<Todo[]>>;
  wouldCreateDependencyCycle: MockedFunction<(todoId: string, dependencyId: string) => Promise<boolean>>;
  findOverdue: MockedFunction<(currentDate?: Date) => Promise<Todo[]>>;
  findDueSoon: MockedFunction<(days?: number, currentDate?: Date) => Promise<Todo[]>>;
  findByDueDateRange: MockedFunction<(startDate: Date, endDate: Date) => Promise<Todo[]>>;
  findAllCompleted: MockedFunction<() => Promise<Todo[]>>;
  findByProjectId: MockedFunction<(projectId: string) => Promise<Todo[]>>;
  findByTagId: MockedFunction<(tagId: string) => Promise<Todo[]>>;
  findByState: MockedFunction<(state: string) => Promise<Todo[]>>;
  findUnassignedSubtasks: MockedFunction<() => Promise<Todo[]>>;
  findSubtasks: MockedFunction<(parentId: string) => Promise<Todo[]>>;
}

interface MockedTodoActivityRepository extends TodoActivityRepository {
  findByTodoId: MockedFunction<(todoId: string) => Promise<TodoActivity[]>>;
  findById: MockedFunction<(id: string) => Promise<TodoActivity | null>>;
  create: MockedFunction<(activity: Omit<TodoActivity, "id" | "createdAt">) => Promise<TodoActivity>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
  updateWorkPeriod: MockedFunction<(id: string, workPeriodId: string | null) => Promise<TodoActivity | null>>;
  findByWorkPeriodId: MockedFunction<(workPeriodId: string) => Promise<TodoActivity[]>>;
  findByDateRange: MockedFunction<(startDate: Date, endDate: Date) => Promise<TodoActivity[]>>;
  update: MockedFunction<(id: string, todoActivity: Partial<TodoActivity>) => Promise<TodoActivity | null>>;
  getTotalWorkTime: MockedFunction<(todoId: string) => Promise<number>>;
  findByWorkPeriod: MockedFunction<(workPeriodId: string) => Promise<TodoActivity[]>>;
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
    updateWorkPeriod: mock<(id: string, workPeriodId: string | null) => Promise<TodoActivity | null>>(() =>
      Promise.resolve(null),
    ),
    findByWorkPeriodId: mock<(workPeriodId: string) => Promise<TodoActivity[]>>(() => Promise.resolve([])),
    findByDateRange: mock<(startDate: Date, endDate: Date) => Promise<TodoActivity[]>>((startDate, endDate) =>
      Promise.resolve([]),
    ),
    update: mock<(id: string, todoActivity: Partial<TodoActivity>) => Promise<TodoActivity | null>>(
      (id, todoActivity) => Promise.resolve(null),
    ),
    getTotalWorkTime: mock<(todoId: string) => Promise<number>>((todoId) => Promise.resolve(0)),
    findByWorkPeriod: mock<(workPeriodId: string) => Promise<TodoActivity[]>>((workPeriodId) => Promise.resolve([])),
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

    const mockTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    });

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

    const mockTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    });

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

    const mockTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    });

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
