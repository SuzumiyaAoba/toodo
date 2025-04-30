import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Tag } from "../../../domain/entities/tag";
import { createTestTodo } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetTodoUseCase } from "./get-todo";

// モック関数の型を拡張
type MockedFunction<T extends (...args: any[]) => any> = {
  [K in keyof ReturnType<typeof mock<T>>]: ReturnType<typeof mock<T>>[K];
} & T;

// モック化されたリポジトリの型
interface MockedTodoRepository extends TodoRepository {
  findAll: MockedFunction<() => Promise<Todo[]>>;
  findById: MockedFunction<(id: string) => Promise<Todo | null>>;
  create: MockedFunction<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>;
  update: MockedFunction<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
}

describe("GetTodoUseCase", () => {
  const mockTodoRepository = {
    findAll: mock<() => Promise<Todo[]>>(() => Promise.resolve([])),
    findById: mock<(id: string) => Promise<Todo | null>>(() => Promise.resolve(null)),
    create: mock<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>(() =>
      Promise.resolve({} as Todo),
    ),
    update: mock<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>(() => Promise.resolve(null)),
    delete: mock<(id: string) => Promise<void>>(() => Promise.resolve()),
  } as MockedTodoRepository;

  const mockTagRepository: TagRepository = {
    createTag: mock(() => Promise.resolve({} as Tag)),
    getTagById: mock(() => Promise.resolve(null)),
    getTagByName: mock(() => Promise.resolve(null)),
    getAllTags: mock(() => Promise.resolve([])),
    updateTag: mock(() => Promise.resolve({} as Tag)),
    deleteTag: mock(() => Promise.resolve()),
    assignTagToTodo: mock(() => Promise.resolve()),
    removeTagFromTodo: mock(() => Promise.resolve()),
    getTagsForTodo: mock(() => Promise.resolve([])),
    getTodoIdsForTag: mock(() => Promise.resolve([])),
    getTodoIdsWithAllTags: mock(() => Promise.resolve([])),
    getTodoIdsWithAnyTag: mock(() => Promise.resolve([])),
    bulkAssignTagToTodos: mock(() => Promise.resolve(0)),
    bulkRemoveTagFromTodos: mock(() => Promise.resolve(0)),
    getTagStatistics: mock(() => Promise.resolve([])),
    findAll: mock(() => Promise.resolve([])),
    findById: mock(() => Promise.resolve(null)),
    create: mock(() => Promise.resolve({} as Tag)),
    update: mock(() => Promise.resolve({} as Tag)),
    delete: mock(() => Promise.resolve()),
    findByName: mock(() => Promise.resolve(null)),
    getTodosByTagId: mock(() => Promise.resolve([])),
    addTagToTodo: mock(() => Promise.resolve()),
  } as TagRepository;

  let useCase: GetTodoUseCase;

  beforeEach(() => {
    useCase = new GetTodoUseCase(mockTodoRepository, mockTagRepository);
    // Clear mock calls between tests
    mockTodoRepository.findById.mockClear();
  });

  test("should get a todo by id", async () => {
    // Arrange
    const todoId = "todo-id";
    const now = new Date();
    const mockTodo = createTestTodo({
      id: todoId,
      title: "Test Todo",
      description: "Test Description",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
      priority: PriorityLevel.MEDIUM,
    });

    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(mockTodo));

    // Act
    const result = await useCase.execute(todoId);

    // Assert
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(result).toEqual({ todo: mockTodo, tags: [] });
  });

  test("should throw TodoNotFoundError when todo does not exist", async () => {
    // Arrange
    const todoId = "non-existent-id";
    mockTodoRepository.findById.mockImplementationOnce(async () => Promise.resolve(null));

    // Act & Assert
    await expect(useCase.execute(todoId)).rejects.toThrow(TodoNotFoundError);
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
  });
});
