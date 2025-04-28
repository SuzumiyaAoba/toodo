import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import type { MockedFunction } from "../../../test/types";
import { GetSubtasksUseCase } from "./get-subtasks";

describe("GetSubtasksUseCase", () => {
  let mockTodoRepository: TodoRepository;
  let useCase: GetSubtasksUseCase;

  function createMockTodo(
    id: string,
    title: string,
    status: TodoStatus = TodoStatus.PENDING,
    workState: WorkState = WorkState.IDLE,
    priority: PriorityLevel = PriorityLevel.MEDIUM,
    parentId?: string,
  ): Todo {
    return new Todo(id, title, status, workState, 0, new Date(), new Date(), new Date(), priority, parentId);
  }

  beforeEach(() => {
    mockTodoRepository = {
      ...createMockedTodoRepository(),
      findById: mock(() => Promise.resolve(null)),
      findByParent: mock(() => Promise.resolve([])),
    };

    useCase = new GetSubtasksUseCase(mockTodoRepository);
  });

  it("should return the subtasks of a todo", async () => {
    // Arrange
    const todoId = "todo-1";
    const subtasks = [
      createMockTodo("subtask-1", "Subtask 1", TodoStatus.PENDING, WorkState.IDLE, PriorityLevel.MEDIUM, todoId),
      createMockTodo("subtask-2", "Subtask 2", TodoStatus.PENDING, WorkState.IDLE, PriorityLevel.MEDIUM, todoId),
    ];
    const todo = createMockTodo(todoId, "Parent Todo");

    mockTodoRepository.findById = mock(() => Promise.resolve(todo));
    mockTodoRepository.findByParent = mock(() => Promise.resolve(subtasks));

    // Act
    const result = await useCase.execute({ todoId });

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.findByParent).toHaveBeenCalledWith(todoId);
    expect(result).toEqual(subtasks);
  });

  it("should throw an error if todo is not found", async () => {
    // Arrange
    const todoId = "non-existent";

    mockTodoRepository.findById = mock(() => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute({ todoId })).rejects.toThrow(new TodoNotFoundError(todoId));
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.findByParent).not.toHaveBeenCalled();
  });
});
