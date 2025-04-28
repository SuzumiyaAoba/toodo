import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import type { MockedFunction } from "../../../test/types";
import { AddSubtaskUseCase } from "./add-subtask";

describe("AddSubtaskUseCase", () => {
  let mockTodoRepository: TodoRepository;
  let useCase: AddSubtaskUseCase;

  // ヘルパー関数
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
      addSubtask: mock(() => Promise.resolve()),
    } as unknown as TodoRepository;

    useCase = new AddSubtaskUseCase(mockTodoRepository);
  });

  it("should add a subtask to a todo", async () => {
    // Arrange
    const parentTodo = createMockTodo("parent-id", "Parent Todo");
    const subtaskTodo = createMockTodo("subtask-id", "Subtask");

    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(parentTodo));
    findByIdMock.mockReturnValueOnce(Promise.resolve(subtaskTodo));
    mockTodoRepository.findById = findByIdMock;

    // Act
    await useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" });

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(2);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("parent-id");
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("subtask-id");
    expect(mockTodoRepository.addSubtask).toHaveBeenCalledWith("parent-id", "subtask-id");
  });

  it("should throw an error if parent todo is not found", async () => {
    // Arrange
    const subtaskTodo = createMockTodo("subtask-id", "Subtask");

    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(null)); // 親タスクはnull
    findByIdMock.mockReturnValueOnce(Promise.resolve(subtaskTodo));
    mockTodoRepository.findById = findByIdMock;

    // Act & Assert
    await expect(useCase.execute({ parentId: "non-existent", subtaskId: "subtask-id" })).rejects.toThrow(
      new TodoNotFoundError("non-existent"),
    );
    expect(mockTodoRepository.addSubtask).not.toHaveBeenCalled();
  });

  it("should throw an error if subtask is not found", async () => {
    // Arrange
    const parentTodo = createMockTodo("parent-id", "Parent Todo");

    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(parentTodo));
    findByIdMock.mockReturnValueOnce(Promise.resolve(null)); // サブタスクはnull
    mockTodoRepository.findById = findByIdMock;

    // Act & Assert
    await expect(useCase.execute({ parentId: "parent-id", subtaskId: "non-existent" })).rejects.toThrow(
      new TodoNotFoundError("non-existent"),
    );
    expect(mockTodoRepository.addSubtask).not.toHaveBeenCalled();
  });
});
