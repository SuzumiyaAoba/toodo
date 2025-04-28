import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetTodoDependenciesUseCase } from "./get-todo-dependencies";

describe("GetTodoDependenciesUseCase", () => {
  let mockTodoRepository: TodoRepository;
  let useCase: GetTodoDependenciesUseCase;

  beforeEach(() => {
    mockTodoRepository = {
      ...createMockedTodoRepository(),
      findById: mock(() => Promise.resolve(null)),
      findDependencies: mock(() => Promise.resolve([])),
    };

    useCase = new GetTodoDependenciesUseCase(mockTodoRepository);
  });

  it("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    mockTodoRepository.findById = mock(() => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute("non-existent-id")).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("non-existent-id");
  });

  it("should return dependencies of a todo", async () => {
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
      undefined,
      undefined,
      ["dep-1", "dep-2"],
    );

    const dependencyTodo1 = new Todo(
      "dep-1",
      "Dependency 1",
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      now,
      now,
      now,
      PriorityLevel.MEDIUM,
    );

    const dependencyTodo2 = new Todo(
      "dep-2",
      "Dependency 2",
      TodoStatus.COMPLETED,
      WorkState.COMPLETED,
      0,
      now,
      now,
      now,
      PriorityLevel.HIGH,
    );

    mockTodoRepository.findById = mock(() => Promise.resolve(mainTodo));
    mockTodoRepository.findDependencies = mock(() => Promise.resolve([dependencyTodo1, dependencyTodo2]));

    // Act
    const result = await useCase.execute("main-id");

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("main-id");
    expect(mockTodoRepository.findDependencies).toHaveBeenCalledWith("main-id");
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(dependencyTodo1);
    expect(result[1]).toBe(dependencyTodo2);
  });

  it("should return empty array when todo has no dependencies", async () => {
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
    mockTodoRepository.findDependencies = mock(() => Promise.resolve([]));

    // Act
    const result = await useCase.execute("todo-id");

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("todo-id");
    expect(mockTodoRepository.findDependencies).toHaveBeenCalledWith("todo-id");
    expect(result).toEqual([]);
  });
});
