import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createTestTodo } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { ActivityType, type TodoActivity } from "../../../domain/entities/todo-activity";
import { InvalidStateTransitionError, TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import type { MockedFunction } from "../../../test/types";
import { CreateTodoActivityUseCase } from "./create-todo-activity";

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

describe("CreateTodoActivityUseCase", () => {
  // 正確な戻り値の型を持つモック関数
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

  let useCase: CreateTodoActivityUseCase;

  beforeEach(() => {
    useCase = new CreateTodoActivityUseCase(mockTodoRepository, mockTodoActivityRepository);
    // Clear mock calls between tests
    mockTodoRepository.findById.mockClear();
    mockTodoRepository.update.mockClear();
    mockTodoActivityRepository.create.mockClear();
  });

  test("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    const todoId = "non-existent-id";
    const activityData = {
      type: "started",
      note: "Starting work",
    };

    mockTodoRepository.findById.mockImplementationOnce(() => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute(todoId, activityData)).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoActivityRepository.create).not.toHaveBeenCalled();
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });

  test("should create a 'started' activity and update todo state from IDLE to ACTIVE", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();
    const activityData = {
      type: "started",
      note: "Starting work",
    };

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

    const createdActivity = {
      id: "activity-id",
      todoId,
      type: ActivityType.STARTED,
      workTime: 0, // 実際の実装では0になる
      previousState: WorkState.IDLE,
      note: "Starting work",
      createdAt: now,
    };

    const updatedTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      status: TodoStatus.PENDING,
      workState: WorkState.ACTIVE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    });

    mockTodoRepository.findById.mockImplementationOnce(() => Promise.resolve(mockTodo));
    mockTodoActivityRepository.create.mockImplementationOnce(() => Promise.resolve(createdActivity));
    mockTodoRepository.update.mockImplementationOnce(() => Promise.resolve(updatedTodo));

    // Act
    const result = await useCase.execute(todoId, activityData);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.create).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.create).toHaveBeenCalledWith({
      todoId,
      type: ActivityType.STARTED,
      workTime: 0, // 実際の実装では0を渡している
      previousState: WorkState.IDLE,
      note: "Starting work",
    });
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.update).toHaveBeenCalledWith(todoId, {
      status: TodoStatus.PENDING,
      workState: WorkState.ACTIVE,
      totalWorkTime: 0,
      lastStateChangeAt: expect.any(Date),
    });
    expect(result).toEqual(createdActivity);
  });

  test("should create a 'paused' activity with work time and update todo state from ACTIVE to PAUSED", async () => {
    // Arrange
    const todoId = "todo-id";
    const pastTime = new Date(Date.now() - 3600000); // 1 hour ago
    const now = new Date();
    const activityData = {
      type: "paused",
      note: "Taking a break",
    };

    const mockTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      status: TodoStatus.PENDING,
      workState: WorkState.ACTIVE,
      totalWorkTime: 0,
      lastStateChangeAt: pastTime, // Todo was set to ACTIVE 1 hour ago
      createdAt: pastTime,
      updatedAt: pastTime,
      priority: PriorityLevel.MEDIUM,
    });

    // Calculate expected work time (around 3600 seconds, but might vary slightly during test execution)
    const expectedMinWorkTime = 3500; // Just a bit less than an hour to handle execution time variations

    mockTodoRepository.findById.mockImplementationOnce(() => Promise.resolve(mockTodo));
    mockTodoActivityRepository.create.mockImplementation((data) =>
      Promise.resolve({
        id: "activity-id",
        ...data,
        createdAt: now,
      }),
    );
    mockTodoRepository.update.mockImplementation((id, data) =>
      Promise.resolve(
        createTestTodo({
          ...mockTodo,
          ...data,
          updatedAt: now,
        }),
      ),
    );

    // Act
    const result = await useCase.execute(todoId, activityData);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.create).toHaveBeenCalledTimes(1);
    if (mockTodoActivityRepository.create.mock.calls[0]?.[0]) {
      expect(mockTodoActivityRepository.create.mock.calls[0][0].todoId).toBe(todoId);
      expect(mockTodoActivityRepository.create.mock.calls[0][0].type).toBe(ActivityType.PAUSED);
      expect(mockTodoActivityRepository.create.mock.calls[0][0].workTime).toBeGreaterThanOrEqual(expectedMinWorkTime);
      expect(mockTodoActivityRepository.create.mock.calls[0][0].previousState).toBe(WorkState.ACTIVE);
      expect(mockTodoActivityRepository.create.mock.calls[0][0].note).toBe("Taking a break");
    }
    if (mockTodoRepository.update.mock.calls[0]?.[0] && mockTodoRepository.update.mock.calls[0]?.[1]) {
      expect(mockTodoRepository.update.mock.calls[0][0]).toBe(todoId);
      expect(mockTodoRepository.update.mock.calls[0][1].status).toBe(TodoStatus.PENDING);
      expect(mockTodoRepository.update.mock.calls[0][1].workState).toBe(WorkState.PAUSED);
      expect(mockTodoRepository.update.mock.calls[0][1].totalWorkTime).toBeGreaterThanOrEqual(expectedMinWorkTime);
      expect(mockTodoRepository.update.mock.calls[0][1].lastStateChangeAt).toBeInstanceOf(Date);
    }
  });

  test("should throw InvalidStateTransitionError when starting an already active todo", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();
    const activityData = {
      type: "started",
      note: "Trying to start again",
    };

    const mockTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      status: TodoStatus.PENDING,
      workState: WorkState.ACTIVE, // Already active
      totalWorkTime: 120,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    });

    mockTodoRepository.findById.mockImplementationOnce(() => Promise.resolve(mockTodo));

    // Act & Assert
    await expect(useCase.execute(todoId, activityData)).rejects.toThrow(InvalidStateTransitionError);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.create).not.toHaveBeenCalled();
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });

  test("should create a 'completed' activity and update todo state to COMPLETED", async () => {
    // Arrange
    const todoId = "todo-id";
    const pastTime = new Date(Date.now() - 1800000); // 30 minutes ago
    const now = new Date();
    const activityData = {
      type: "completed",
      note: "Finished the task",
    };

    const mockTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      status: TodoStatus.PENDING,
      workState: WorkState.ACTIVE,
      totalWorkTime: 600, // Already had 10 minutes of work
      lastStateChangeAt: pastTime, // Todo was set to ACTIVE 30 minutes ago
      createdAt: pastTime,
      updatedAt: pastTime,
      priority: PriorityLevel.MEDIUM,
    });

    // Calculate expected work time (around 1800 seconds + 600 existing seconds)
    const expectedMinTotalWorkTime = 2300; // A bit less than 30 min + 10 min to handle variations

    mockTodoRepository.findById.mockImplementationOnce(() => Promise.resolve(mockTodo));
    mockTodoActivityRepository.create.mockImplementation((data) =>
      Promise.resolve({
        id: "activity-id",
        ...data,
        createdAt: now,
      }),
    );
    mockTodoRepository.update.mockImplementation((id, data) =>
      Promise.resolve(
        createTestTodo({
          ...mockTodo,
          ...data,
          updatedAt: now,
        }),
      ),
    );

    // Act
    const result = await useCase.execute(todoId, activityData);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoActivityRepository.create).toHaveBeenCalledTimes(1);
    if (mockTodoActivityRepository.create.mock.calls[0]?.[0]) {
      expect(mockTodoActivityRepository.create.mock.calls[0][0].todoId).toBe(todoId);
      expect(mockTodoActivityRepository.create.mock.calls[0][0].type).toBe(ActivityType.COMPLETED);
      expect(mockTodoActivityRepository.create.mock.calls[0][0].workTime).toBeGreaterThanOrEqual(1700); // ~30 min
      expect(mockTodoActivityRepository.create.mock.calls[0][0].previousState).toBe(WorkState.ACTIVE);
    }
    if (mockTodoRepository.update.mock.calls[0]?.[1]) {
      expect(mockTodoRepository.update.mock.calls[0][1].status).toBe(TodoStatus.COMPLETED);
      expect(mockTodoRepository.update.mock.calls[0][1].workState).toBe(WorkState.COMPLETED);
      expect(mockTodoRepository.update.mock.calls[0][1].totalWorkTime).toBeGreaterThanOrEqual(expectedMinTotalWorkTime);
    }
  });
});
