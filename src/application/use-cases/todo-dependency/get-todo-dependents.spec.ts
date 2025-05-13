import { beforeEach, describe, expect, it, mock } from "bun:test";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import type { MockedFunction } from "../../../test/types";
import { GetTodoDependentsUseCase } from "./get-todo-dependents";

describe("GetTodoDependentsUseCase", () => {
  // リポジトリのモック
  const mockTodoRepository = {
    findById: mock(() => Promise.resolve(null)),
    findDependents: mock(() => Promise.resolve([])),
    create: mock(() => Promise.resolve({} as Todo)),
    update: mock(() => Promise.resolve({} as Todo)),
    delete: mock(() => Promise.resolve()),
    findAll: mock(() => Promise.resolve([])),
    findByProjectId: mock(() => Promise.resolve([])),
    findByTagId: mock(() => Promise.resolve([])),
    findDependencies: mock(() => Promise.resolve([])),
    addDependency: mock(() => Promise.resolve()),
    removeDependency: mock(() => Promise.resolve()),
    wouldCreateDependencyCycle: mock(() => Promise.resolve(false)),
    findAllCompleted: mock(() => Promise.resolve([])),
    // 期限日関連のメソッドを追加
    findOverdue: mock(() => Promise.resolve([])),
    findDueSoon: mock(() => Promise.resolve([])),
    findByDueDateRange: mock(() => Promise.resolve([])),
  } as TodoRepository;

  // テスト対象のユースケース
  let useCase: GetTodoDependentsUseCase;

  beforeEach(() => {
    // モックをリセット
    Object.values(mockTodoRepository).forEach((mockFn) => {
      if (typeof mockFn === "function" && "mockClear" in mockFn) {
        mockFn.mockClear();
      }
    });
    useCase = new GetTodoDependentsUseCase(mockTodoRepository);
  });

  it("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    mockTodoRepository.findById = mock(() => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute("non-existent-id")).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("non-existent-id");
  });

  it("should return dependents of a todo", async () => {
    // Arrange
    const now = new Date();

    const mainTodo = new Todo(
      "main-id",
      "Main Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.LOW,
    );

    const dependentTodo1 = new Todo(
      "dep-1",
      "Dependent 1",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      ["main-id"],
    );

    const dependentTodo2 = new Todo(
      "dep-2",
      "Dependent 2",
      TodoStatus.COMPLETED,
      WorkState.COMPLETED,
      0,
      now,
      now,
      now,
      PriorityLevel.HIGH,
      undefined,
      undefined,
      ["main-id"],
    );

    mockTodoRepository.findById = mock(() => Promise.resolve(mainTodo));
    mockTodoRepository.findDependents = mock(() => Promise.resolve([dependentTodo1, dependentTodo2]));

    // Act
    const result = await useCase.execute("main-id");

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("main-id");
    expect(mockTodoRepository.findDependents).toHaveBeenCalledWith("main-id");
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(dependentTodo1);
    expect(result[1]).toBe(dependentTodo2);
  });

  it("should return empty array when todo has no dependents", async () => {
    // Arrange
    const now = new Date();
    const todo = new Todo(
      "todo-id",
      "Test Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
    );

    mockTodoRepository.findById = mock(() => Promise.resolve(todo));
    mockTodoRepository.findDependents = mock(() => Promise.resolve([]));

    // Act
    const result = await useCase.execute("todo-id");

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("todo-id");
    expect(mockTodoRepository.findDependents).toHaveBeenCalledWith("todo-id");
    expect(result).toEqual([]);
  });
});
