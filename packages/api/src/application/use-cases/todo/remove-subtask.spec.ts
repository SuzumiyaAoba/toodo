import { describe, expect, it, mock } from "bun:test";
import { Todo } from "../../../domain/entities/todo";
import { SubtaskNotFoundError, TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { RemoveSubtaskUseCase } from "./remove-subtask";

describe("Remove Subtask Use Case", () => {
  const mockTodoRepository = {
    findById: mock(),
    removeSubtask: mock(),
  } as unknown as TodoRepository;

  const useCase = new RemoveSubtaskUseCase(mockTodoRepository);

  const parentTodo = {
    id: "parent-id",
    hasSubtask: mock().mockReturnValue(true),
  } as unknown as Todo;

  const subtaskTodo = {
    id: "subtask-id",
  } as unknown as Todo;

  it("should mock a parent task with subtasks", () => {
    // Mock a parent task with subtasks
  });

  it("should mock a subtask", () => {
    // Mock a subtask
  });

  it("should set up the behavior of findById", () => {
    // Set up the behavior of findById
    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(parentTodo));
    findByIdMock.mockReturnValueOnce(Promise.resolve(subtaskTodo));
    mockTodoRepository.findById = findByIdMock;
  });

  it("should execute the target method for testing", async () => {
    // Execute the target method for testing
    await useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" });
  });

  it("should verify the expected behavior", () => {
    // Verify the expected behavior
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(2);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("parent-id");
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("subtask-id");
    expect(parentTodo.hasSubtask).toHaveBeenCalledWith("subtask-id");
    expect(mockTodoRepository.removeSubtask).toHaveBeenCalledWith("parent-id", "subtask-id");
  });

  it("should mock the case where the parent task does not exist", async () => {
    // Mock the case where the parent task does not exist
    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(null));
    mockTodoRepository.findById = findByIdMock;

    // Verify the expected error
    await expect(useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" })).rejects.toThrow(
      TodoNotFoundError,
    );
  });

  it("should mock the case where the parent task exists but the subtask does not", async () => {
    // Mock the case where the parent task exists but the subtask does not
    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(parentTodo));
    findByIdMock.mockReturnValueOnce(Promise.resolve(null));
    mockTodoRepository.findById = findByIdMock;

    // Verify the expected error
    await expect(useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" })).rejects.toThrow(
      TodoNotFoundError,
    );
  });

  it("should mock the case where the subtask exists but is not associated with the parent task", async () => {
    // Mock the case where the subtask exists but is not associated with the parent task
    const parentTodo = {
      id: "parent-id",
      hasSubtask: mock().mockReturnValue(false), // Not associated
    } as unknown as Todo;

    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(parentTodo));
    findByIdMock.mockReturnValueOnce(Promise.resolve(subtaskTodo));
    mockTodoRepository.findById = findByIdMock;

    // Verify the expected error
    await expect(useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" })).rejects.toThrow(
      SubtaskNotFoundError,
    );
  });
});
