import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { DependencyNotFoundError, TodoNotFoundError } from "../../../domain/errors/todo-errors";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import { RemoveTodoDependencyUseCase } from "./remove-todo-dependency";

describe("RemoveTodoDependencyUseCase", () => {
  let mockTodoRepository: TodoRepository;
  let useCase: RemoveTodoDependencyUseCase;

  beforeEach(() => {
    mockTodoRepository = {
      ...createMockedTodoRepository(),
      findById: mock(() => Promise.resolve(null)),
      removeDependency: mock(() => Promise.resolve()),
    };

    useCase = new RemoveTodoDependencyUseCase(mockTodoRepository);
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

  it("should throw DependencyNotFoundError when dependency does not exist", async () => {
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

    // 依存関係がない状態をモック
    mockTodoRepository.findById = mock((id: string) => {
      if (id === "todo-id") return Promise.resolve(todo);
      if (id === "dependency-id") return Promise.resolve(dependencyTodo);
      return Promise.resolve(null);
    });

    // 依存関係チェックで失敗するようにモック
    todo.hasDependencyOn = mock(() => false);

    // Act & Assert
    await expect(useCase.execute("todo-id", "dependency-id")).rejects.toThrow(DependencyNotFoundError);
    expect(todo.hasDependencyOn).toHaveBeenCalledWith("dependency-id");
    expect(mockTodoRepository.removeDependency).not.toHaveBeenCalled();
  });

  it("should remove dependency successfully", async () => {
    // Arrange
    const now = new Date();
    const dependencyTodo = new Todo(
      "dependency-id",
      "Dependency Todo",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
      undefined,
      undefined,
      [],
      ["todo-id"],
    );

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
      undefined,
      undefined,
      ["dependency-id"],
    );

    // Todoに依存関係があるように見せかける
    todo.hasDependencyOn = mock((id: string) => id === "dependency-id");

    mockTodoRepository.findById = mock((id: string) => {
      if (id === "todo-id") return Promise.resolve(todo);
      if (id === "dependency-id") return Promise.resolve(dependencyTodo);
      return Promise.resolve(null);
    });

    // Act
    await useCase.execute("todo-id", "dependency-id");

    // Assert
    expect(mockTodoRepository.removeDependency).toHaveBeenCalledWith("todo-id", "dependency-id");
  });
});
