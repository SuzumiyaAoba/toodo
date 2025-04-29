import { describe, expect, it, mock } from "bun:test";
import {
  createMockedTagRepository,
  createMockedTodoRepository,
  createTestTodo,
} from "../../../domain/entities/test-helpers";
import { PriorityLevel, TodoStatus } from "../../../domain/entities/todo";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetTodosByMultipleTagsUseCase } from "./get-todos-by-multiple-tags";

describe("GetTodosByMultipleTagsUseCase", () => {
  // 有効なUUID形式のIDを使用
  const validTagIds = ["a0b1c2d3-e4f5-6789-abcd-ef0123456789", "b1c2d3e4-f5a6-7890-bcde-f01234567890"];
  const invalidTagId = "invalid-uuid";

  // テスト用のTodoオブジェクトを作成
  const todos = [
    createTestTodo({
      id: "todo-1",
      title: "Todo 1",
      status: TodoStatus.PENDING,
      priority: PriorityLevel.MEDIUM,
    }),
    createTestTodo({
      id: "todo-2",
      title: "Todo 2",
      status: TodoStatus.PENDING,
      priority: PriorityLevel.HIGH,
    }),
    createTestTodo({
      id: "todo-3",
      title: "Todo 3",
      status: TodoStatus.COMPLETED,
      priority: PriorityLevel.LOW,
    }),
  ];

  it("should get todos with all specified tags", async () => {
    const todoIds = ["todo1", "todo2"];
    const mockTodos = [
      createTestTodo({ id: "todo1", title: "Todo 1" }),
      createTestTodo({ id: "todo2", title: "Todo 2" }),
    ];

    const getTagById = mock((id: string) => Promise.resolve({ id, name: `Tag ${id}` }));
    const getTodoIdsWithAllTags = mock(() => Promise.resolve(todoIds));
    const findById = mock((id: string) => Promise.resolve(mockTodos.find((todo) => todo.id === id)));

    const mockTagRepository = {
      getTagById,
      getTodoIdsWithAllTags,
      getTodoIdsWithAnyTag: mock(() => Promise.resolve([])),
    } as unknown as TagRepository;

    const mockTodoRepository = {
      findById,
    } as unknown as TodoRepository;

    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);
    const result = await useCase.execute({ tagIds: validTagIds, mode: "all" });

    expect(getTagById.mock.calls.length).toBe(2);
    expect(getTodoIdsWithAllTags.mock.calls.length).toBe(1);
    // @ts-ignore
    expect(getTodoIdsWithAllTags.mock.calls[0]).toEqual([validTagIds]);
    expect(result).toEqual(mockTodos);
  });

  it("should get todos with any of the specified tags", async () => {
    const todoIds = ["todo1", "todo2"];
    const mockTodos = [
      createTestTodo({ id: "todo1", title: "Todo 1" }),
      createTestTodo({ id: "todo2", title: "Todo 2" }),
    ];

    const getTagById = mock((id: string) => Promise.resolve({ id, name: `Tag ${id}` }));
    const getTodoIdsWithAnyTag = mock(() => Promise.resolve(todoIds));
    const findById = mock((id: string) => Promise.resolve(mockTodos.find((todo) => todo.id === id)));

    const mockTagRepository = {
      getTagById,
      getTodoIdsWithAllTags: mock(() => Promise.resolve([])),
      getTodoIdsWithAnyTag,
    } as unknown as TagRepository;

    const mockTodoRepository = {
      findById,
    } as unknown as TodoRepository;

    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);
    const result = await useCase.execute({ tagIds: validTagIds, mode: "any" });

    expect(getTagById.mock.calls.length).toBe(2);
    expect(getTodoIdsWithAnyTag.mock.calls.length).toBe(1);
    // @ts-ignore
    expect(getTodoIdsWithAnyTag.mock.calls[0]).toEqual([validTagIds]);
    expect(result).toEqual(mockTodos);
  });

  it("should return empty array for empty tag IDs", async () => {
    const mockTagRepository = createMockedTagRepository();
    const mockTodoRepository = createMockedTodoRepository();

    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);
    const result = await useCase.execute({ tagIds: [], mode: "all" });
    expect(result).toEqual([]);
  });

  it("should throw error if tag ID is not a valid UUID", async () => {
    const mockTagRepository = createMockedTagRepository();
    const mockTodoRepository = createMockedTodoRepository();

    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);
    await expect(useCase.execute({ tagIds: [invalidTagId], mode: "all" })).rejects.toThrow(
      "Tag ID must be a valid UUID",
    );
  });

  it("should throw error if a tag doesn't exist", async () => {
    const getTagById = mock(() => Promise.resolve(null));

    const mockTagRepository = {
      getTagById,
      getTodoIdsWithAllTags: mock(() => Promise.resolve([])),
      getTodoIdsWithAnyTag: mock(() => Promise.resolve([])),
    } as unknown as TagRepository;

    const mockTodoRepository = createMockedTodoRepository();

    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);
    await expect(useCase.execute({ tagIds: validTagIds, mode: "all" })).rejects.toThrow(
      `Tag with ID '${validTagIds[0]}' not found`,
    );
  });
});
