import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import {
  DependencyCycleError,
  DependencyExistsError,
  SelfDependencyError,
  TodoNotFoundError,
} from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { AddTodoDependencyUseCase } from "./add-todo-dependency";

describe("AddTodoDependencyUseCase", () => {
  // リポジトリのモック
  let mockTodoRepository: TodoRepository;

  // テスト対象のユースケース
  let useCase: AddTodoDependencyUseCase;

  beforeEach(() => {
    // モックリポジトリの作成
    mockTodoRepository = {
      ...createMockedTodoRepository(),
      findById: mock(() => Promise.resolve(null)),
      wouldCreateDependencyCycle: mock(() => Promise.resolve(false)),
      addDependency: mock(() => Promise.resolve()),
      hasDependency: mock(() => Promise.resolve(false)),
    };

    useCase = new AddTodoDependencyUseCase(mockTodoRepository);
  });

  it("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    mockTodoRepository.findById = mock(() => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute("todo-id", "dependency-id")).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("todo-id");
  });

  it("should throw TodoNotFoundError when dependency todo does not exist", async () => {
    // Arrange
    const todo = new Todo(
      "todo-id",
      "Test Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );

    mockTodoRepository.findById = mock((id) => {
      if (id === "todo-id") return Promise.resolve(todo);
      return Promise.resolve(null);
    });

    // Act & Assert
    await expect(useCase.execute("todo-id", "dependency-id")).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("todo-id");
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("dependency-id");
  });

  it("should throw SelfDependencyError when trying to add self as dependency", async () => {
    // Arrange
    const todo = new Todo(
      "todo-id",
      "Test Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );

    mockTodoRepository.findById = mock(() => Promise.resolve(todo));

    // Act & Assert
    await expect(useCase.execute("todo-id", "todo-id")).rejects.toThrow(SelfDependencyError);
  });

  it("should throw DependencyExistsError when dependency already exists", async () => {
    // Arrange
    const dependencyTodo = new Todo(
      "dependency-id",
      "Dependency Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );

    const todo = new Todo(
      "todo-id",
      "Test Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );

    mockTodoRepository.findById = mock((id: string) => {
      if (id === "todo-id") return Promise.resolve(todo);
      if (id === "dependency-id") return Promise.resolve(dependencyTodo);
      return Promise.resolve(null);
    });

    mockTodoRepository.hasDependency = mock(() => Promise.resolve(true));

    // Act & Assert
    await expect(useCase.execute("todo-id", "dependency-id")).rejects.toThrow(DependencyExistsError);
    expect(mockTodoRepository.hasDependency).toHaveBeenCalledWith("todo-id", "dependency-id");
  });

  it("should throw DependencyCycleError when adding would create a cycle", async () => {
    // Arrange
    const todoA = new Todo(
      "todo-a",
      "Todo A",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );

    const todoB = new Todo(
      "todo-b",
      "Todo B",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );

    // hasDependencyOnをモック
    todoA.hasDependencyOn = mock(() => false);
    todoB.hasDependencyOn = mock(() => false);

    mockTodoRepository.findById = mock((id: string) => {
      if (id === "todo-a") return Promise.resolve(todoA);
      if (id === "todo-b") return Promise.resolve(todoB);
      return Promise.resolve(null);
    });

    // 循環依存が発生すると仮定
    mockTodoRepository.wouldCreateDependencyCycle = mock(() => Promise.resolve(true));

    // Act & Assert
    await expect(useCase.execute("todo-a", "todo-b")).rejects.toThrow(DependencyCycleError);
    expect(mockTodoRepository.wouldCreateDependencyCycle).toHaveBeenCalledWith("todo-a", "todo-b");
  });

  it("should add dependency successfully", async () => {
    // Arrange
    const dependencyTodo = new Todo(
      "dependency-id",
      "Dependency Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );

    const todo = new Todo(
      "todo-id",
      "Test Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );

    todo.hasDependencyOn = mock(() => false);

    mockTodoRepository.findById = mock((id: string) => {
      if (id === "todo-id") return Promise.resolve(todo);
      if (id === "dependency-id") return Promise.resolve(dependencyTodo);
      return Promise.resolve(null);
    });

    mockTodoRepository.wouldCreateDependencyCycle = mock(() => Promise.resolve(false));

    // Act
    await useCase.execute("todo-id", "dependency-id");

    // Assert
    expect(mockTodoRepository.addDependency).toHaveBeenCalledWith("todo-id", "dependency-id");
  });
});
