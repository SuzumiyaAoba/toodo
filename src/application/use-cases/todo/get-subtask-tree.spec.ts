import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetSubtaskTreeUseCase } from "./get-subtask-tree";

describe("GetSubtaskTreeUseCase", () => {
  let mockTodoRepository: TodoRepository;
  let useCase: GetSubtaskTreeUseCase;

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
      findChildrenTree: mock(() => Promise.resolve([])),
    };

    useCase = new GetSubtaskTreeUseCase(mockTodoRepository);
  });

  it("should return a subtask tree for a todo", async () => {
    // Arrange
    const rootTodo = createMockTodo("todo-1", "Root Todo");
    const subtasks = [
      createMockTodo("subtask-1", "Subtask 1", TodoStatus.PENDING, WorkState.IDLE, PriorityLevel.MEDIUM, "todo-1"),
      createMockTodo("subtask-2", "Subtask 2", TodoStatus.PENDING, WorkState.IDLE, PriorityLevel.MEDIUM, "todo-1"),
    ];

    mockTodoRepository.findById = mock(() => Promise.resolve(rootTodo));
    mockTodoRepository.findChildrenTree = mock(() => Promise.resolve(subtasks));

    // Act
    const result = await useCase.execute({ todoId: "todo-1" });

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("todo-1");
    expect(mockTodoRepository.findChildrenTree).toHaveBeenCalledWith("todo-1", 10);
    expect(result).toEqual(subtasks);
  });

  it("should throw an error if the root todo is not found", async () => {
    // Arrange
    mockTodoRepository.findById = mock(() => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute({ todoId: "non-existent" })).rejects.toThrow(new TodoNotFoundError("non-existent"));
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("non-existent");
    expect(mockTodoRepository.findChildrenTree).not.toHaveBeenCalled();
  });
});
