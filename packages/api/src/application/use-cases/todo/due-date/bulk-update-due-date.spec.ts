import { describe, expect, it, jest } from "bun:test";
import { BulkUpdateDueDateUseCase } from "../../../../application/use-cases/todo/due-date/bulk-update-due-date";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../../domain/entities/todo";
import type { TodoRepository } from "../../../../domain/repositories/todo-repository";

describe("BulkUpdateDueDateUseCase", () => {
  it("should update due dates for multiple todos", async () => {
    // Arrange
    const mockTodos = [
      new Todo("1", "Todo 1", TodoStatus.PENDING, WorkState.IDLE, 0),
      new Todo("2", "Todo 2", TodoStatus.PENDING, WorkState.IDLE, 0),
      new Todo("3", "Todo 3", TodoStatus.PENDING, WorkState.IDLE, 0),
    ];

    const mockUpdatedTodos = [
      new Todo(
        "1",
        "Todo 1",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        new Date("2025-05-01"),
      ),
      new Todo(
        "2",
        "Todo 2",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        new Date("2025-05-01"),
      ),
      new Todo(
        "3",
        "Todo 3",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        new Date("2025-05-01"),
      ),
    ];

    const mockTodoRepository: Pick<TodoRepository, "findById" | "update"> = {
      findById: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve(mockTodos.find((todo) => todo.id === id) || null);
      }),
      update: jest.fn().mockImplementation((id: string, todo: Todo) => {
        return Promise.resolve(mockUpdatedTodos.find((t) => t.id === id) || null);
      }),
    };

    const useCase = new BulkUpdateDueDateUseCase(mockTodoRepository as TodoRepository);
    const dueDate = new Date("2025-05-01");

    // Act
    const result = await useCase.execute(["1", "2", "3"], dueDate);

    // Assert
    expect(result).toHaveLength(3);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(3);
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(3);
    result.forEach((todo) => {
      expect(todo.dueDate).toEqual(dueDate);
    });
  });

  it("should handle non-existent todo IDs", async () => {
    // Arrange
    const mockTodos = [new Todo("1", "Todo 1", TodoStatus.PENDING, WorkState.IDLE, 0)];

    const mockUpdatedTodos = [
      new Todo(
        "1",
        "Todo 1",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        new Date("2025-05-01"),
      ),
    ];

    const mockTodoRepository: Pick<TodoRepository, "findById" | "update"> = {
      findById: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve(mockTodos.find((todo) => todo.id === id) || null);
      }),
      update: jest.fn().mockImplementation((id: string, todo: Todo) => {
        return Promise.resolve(mockUpdatedTodos.find((t) => t.id === id) || null);
      }),
    };

    const useCase = new BulkUpdateDueDateUseCase(mockTodoRepository as TodoRepository);
    const dueDate = new Date("2025-05-01");

    // Act
    const result = await useCase.execute(["1", "2", "3"], dueDate);

    // Assert
    expect(result).toHaveLength(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(3);
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);
    if (result[0]) {
      expect(result[0].id).toBe("1");
      expect(result[0].dueDate).toEqual(dueDate);
    }
  });

  it("should remove due dates when undefined is passed", async () => {
    // Arrange
    const mockTodos = [
      new Todo(
        "1",
        "Todo 1",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        new Date("2025-04-01"),
      ),
      new Todo(
        "2",
        "Todo 2",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
        undefined,
        undefined,
        new Date("2025-04-02"),
      ),
    ];

    const mockUpdatedTodos = [
      new Todo(
        "1",
        "Todo 1",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
      ),
      new Todo(
        "2",
        "Todo 2",
        TodoStatus.PENDING,
        WorkState.IDLE,
        0,
        new Date(),
        new Date(),
        new Date(),
        PriorityLevel.MEDIUM,
      ),
    ];

    const mockTodoRepository: Pick<TodoRepository, "findById" | "update"> = {
      findById: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve(mockTodos.find((todo) => todo.id === id) || null);
      }),
      update: jest.fn().mockImplementation((id: string, todo: Todo) => {
        return Promise.resolve(mockUpdatedTodos.find((t) => t.id === id) || null);
      }),
    };

    const useCase = new BulkUpdateDueDateUseCase(mockTodoRepository as TodoRepository);

    // Act
    const result = await useCase.execute(["1", "2"], undefined);

    // Assert
    expect(result).toHaveLength(2);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(2);
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(2);
    result.forEach((todo) => {
      expect(todo.dueDate).toBeUndefined();
    });
  });
});
