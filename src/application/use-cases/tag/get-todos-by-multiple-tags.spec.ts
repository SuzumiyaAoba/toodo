import { describe, expect, it, mock } from "bun:test";
import { createMockedTodoRepository, createTestTodo } from "../../../domain/entities/test-helpers";
import { PriorityLevel, TodoStatus } from "../../../domain/entities/todo";
import { GetTodosByMultipleTagsUseCase } from "./get-todos-by-multiple-tags";

describe("GetTodosByMultipleTagsUseCase", () => {
  // 有効なUUID形式のIDを使用
  const validTagIds = ["a0b1c2d3-e4f5-6789-abcd-ef0123456789", "b1c2d3e4-f5a6-7890-bcde-f01234567890"];
  const nonExistentTagId = "12345678-1234-1234-1234-123456789012";

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

  const mockTagRepository = {
    createTag: mock(() =>
      Promise.resolve({
        id: "tag1",
        name: "Work",
        color: "#FF5733",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
    getTagById: mock((id: string) => {
      if (id === "non-existent-id") {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        id: id,
        name: "Tag " + id,
        color: "#FF5733",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
    getTagByName: mock(() => Promise.resolve(null)),
    getAllTags: mock(() => Promise.resolve([])),
    updateTag: mock(() =>
      Promise.resolve({
        id: "tag1",
        name: "Work",
        color: "#FF5733",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ),
    deleteTag: mock(() => Promise.resolve()),
    assignTagToTodo: mock(() => Promise.resolve()),
    removeTagFromTodo: mock(() => Promise.resolve()),
    getTagsForTodo: mock(() => Promise.resolve([])),
    getTodoIdsForTag: mock(() => Promise.resolve([])),
    getTodoIdsWithAllTags: mock((tagIds) => {
      if (tagIds.includes("empty-results")) {
        return Promise.resolve([]);
      }
      return Promise.resolve(["todo-1", "todo-2"]);
    }),
    getTodoIdsWithAnyTag: mock((tagIds) => {
      if (tagIds.includes("empty-results")) {
        return Promise.resolve([]);
      }
      return Promise.resolve(["todo-1", "todo-2", "todo-3"]);
    }),
    bulkAssignTagToTodos: mock(() => Promise.resolve(0)),
    bulkRemoveTagFromTodos: mock(() => Promise.resolve(0)),
    getTagStatistics: mock(() => Promise.resolve([])),
  };

  const mockTodoRepository = {
    ...createMockedTodoRepository(),
    findById: mock((id: string) => {
      if (todos.some((todo) => todo.id === id)) {
        return Promise.resolve(todos.find((todo) => todo.id === id) || null);
      }
      return Promise.resolve(null);
    }),
  };

  it("should get todos with all specified tags", async () => {
    // テスト開始前にモックをリセット
    mockTagRepository.getTodoIdsWithAllTags.mockClear();
    mockTagRepository.getTodoIdsWithAnyTag.mockClear();

    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);

    const result = await useCase.execute({
      tagIds: validTagIds,
      mode: "all",
    });

    expect(result.length).toBe(2);
    expect(result[0].id).toBe("todo-1");
    expect(result[1].id).toBe("todo-2");
    expect(mockTagRepository.getTodoIdsWithAllTags).toHaveBeenCalledWith(validTagIds);
    expect(mockTagRepository.getTodoIdsWithAnyTag).not.toHaveBeenCalled();
  });

  it("should get todos with any of the specified tags", async () => {
    // テスト開始前にモックをリセット
    mockTagRepository.getTodoIdsWithAllTags.mockClear();
    mockTagRepository.getTodoIdsWithAnyTag.mockClear();

    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);

    const result = await useCase.execute({
      tagIds: validTagIds,
      mode: "any",
    });

    expect(result.length).toBe(3);
    expect(result[0].id).toBe("todo-1");
    expect(result[1].id).toBe("todo-2");
    expect(result[2].id).toBe("todo-3");
    expect(mockTagRepository.getTodoIdsWithAnyTag).toHaveBeenCalledWith(validTagIds);
    expect(mockTagRepository.getTodoIdsWithAllTags).not.toHaveBeenCalled();
  });

  it("should return empty array for empty tag IDs", async () => {
    // テスト開始前にモックをリセット
    mockTagRepository.getTodoIdsWithAllTags.mockClear();
    mockTagRepository.getTodoIdsWithAnyTag.mockClear();

    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);

    const result = await useCase.execute({
      tagIds: [],
      mode: "all",
    });

    expect(result).toEqual([]);
    expect(mockTagRepository.getTodoIdsWithAllTags).not.toHaveBeenCalled();
    expect(mockTagRepository.getTodoIdsWithAnyTag).not.toHaveBeenCalled();
  });

  it("should throw error if a tag doesn't exist", async () => {
    const useCase = new GetTodosByMultipleTagsUseCase(mockTagRepository, mockTodoRepository);

    // モックを一時的に上書き
    const originalMock = mockTagRepository.getTagById;
    mockTagRepository.getTagById = mock((id) => {
      if (id === nonExistentTagId) {
        return Promise.resolve(null);
      }
      return Promise.resolve({
        id,
        name: `Tag ${id.slice(0, 8)}`,
        color: "#FF5733",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    try {
      await expect(
        useCase.execute({
          tagIds: [validTagIds[0], nonExistentTagId],
          mode: "all",
        }),
      ).rejects.toThrow(`Tag with ID '${nonExistentTagId}' not found`);
    } finally {
      // テスト後にモックを元に戻す
      mockTagRepository.getTagById = originalMock;
    }
  });
});
