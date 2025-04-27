import { describe, expect, it, mock } from "bun:test";
import { createTestTodo } from "../../../domain/entities/test-helpers";
import { PriorityLevel, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { BulkAssignTagUseCase, BulkRemoveTagUseCase } from "./bulk-tag-operations";

describe("BulkTagOperations", () => {
  // 有効なUUID形式のIDを使用
  const validTagId = "a0b1c2d3-e4f5-6789-abcd-ef0123456789";
  const validTodoIds = ["c2d3e4f5-6789-abcd-ef01-23456789abcd", "d3e4f5a6-789a-bcde-f012-3456789abcde"];
  const nonExistentTagId = "f5a6b7c8-89ab-cdef-0123-456789abcdef";
  const nonExistentTodoId = "e4f5a6b7-89ab-cdef-0123-456789abcdef";

  const mockTag = {
    id: validTagId,
    name: "Work",
    color: "#FF5733",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // モック関数を作成（各テストで上書きできるように）
  const createMockTagRepository = () => ({
    createTag: mock(() => Promise.resolve(mockTag)),
    getTagById: mock((id: string) => {
      if (id === validTagId) {
        return Promise.resolve(mockTag);
      }
      return Promise.resolve(null);
    }),
    getTagByName: mock(() => Promise.resolve(null)),
    getAllTags: mock(() => Promise.resolve([])),
    updateTag: mock(() => Promise.resolve(mockTag)),
    deleteTag: mock(() => Promise.resolve()),
    assignTagToTodo: mock(() => Promise.resolve()),
    removeTagFromTodo: mock(() => Promise.resolve()),
    getTagsForTodo: mock(() => Promise.resolve([])),
    getTodoIdsForTag: mock(() => Promise.resolve([])),
    getTodoIdsWithAllTags: mock(() => Promise.resolve([])),
    getTodoIdsWithAnyTag: mock(() => Promise.resolve([])),
    bulkAssignTagToTodos: mock(() => Promise.resolve(2)),
    bulkRemoveTagFromTodos: mock(() => Promise.resolve(2)),
    getTagStatistics: mock(() => Promise.resolve([])),
  });

  const createMockTodoRepository = () => ({
    create: mock(() =>
      Promise.resolve(
        createTestTodo({
          id: "new-todo-id",
          title: "New Todo",
          status: TodoStatus.PENDING,
          workState: WorkState.IDLE,
          totalWorkTime: 0,
          lastStateChangeAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: PriorityLevel.MEDIUM,
        }),
      ),
    ),
    findById: mock((id: string) => {
      if (validTodoIds.includes(id)) {
        return Promise.resolve(
          createTestTodo({
            id,
            title: `Todo ${id.slice(0, 8)}`,
            status: TodoStatus.PENDING,
            workState: WorkState.IDLE,
            totalWorkTime: 0,
            lastStateChangeAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            priority: PriorityLevel.MEDIUM,
          }),
        );
      }
      return Promise.resolve(null);
    }),
    findAll: mock(() => Promise.resolve([])),
    update: mock(() =>
      Promise.resolve(
        createTestTodo({
          id: "updated-todo-id",
          title: "Updated Todo",
          status: TodoStatus.PENDING,
          workState: WorkState.IDLE,
          totalWorkTime: 0,
          lastStateChangeAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: PriorityLevel.MEDIUM,
        }),
      ),
    ),
    delete: mock(() => Promise.resolve()),
    updateWorkState: mock(() =>
      Promise.resolve(
        createTestTodo({
          id: "todo-id",
          title: "Todo",
          status: TodoStatus.PENDING,
          workState: WorkState.ACTIVE,
          totalWorkTime: 0,
          lastStateChangeAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: PriorityLevel.MEDIUM,
        }),
      ),
    ),
    updateWorkTime: mock(() =>
      Promise.resolve(
        createTestTodo({
          id: "todo-id",
          title: "Todo",
          status: TodoStatus.PENDING,
          workState: WorkState.IDLE,
          totalWorkTime: 60,
          lastStateChangeAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          priority: PriorityLevel.MEDIUM,
        }),
      ),
    ),
    // 依存関係関連のメソッドを追加
    addDependency: mock(() => Promise.resolve()),
    removeDependency: mock(() => Promise.resolve()),
    findDependents: mock(() => Promise.resolve([])),
    findDependencies: mock(() => Promise.resolve([])),
    wouldCreateDependencyCycle: mock(() => Promise.resolve(false)),
    findAllCompleted: mock(() => Promise.resolve([])),
  });

  describe("BulkAssignTagUseCase", () => {
    it("should assign tag to multiple todos", async () => {
      const mockTagRepository = createMockTagRepository();
      const mockTodoRepository = createMockTodoRepository();
      const useCase = new BulkAssignTagUseCase(mockTagRepository, mockTodoRepository);

      const result = await useCase.execute({
        tagId: validTagId,
        todoIds: validTodoIds,
      });

      expect(result.success).toBe(true);
      expect(result.assignedCount).toBe(2);
      expect(result.tag).toEqual({
        id: validTagId,
        name: "Work",
        color: "#FF5733",
      });
      expect(mockTagRepository.bulkAssignTagToTodos).toHaveBeenCalledWith(validTagId, validTodoIds);
    });

    it("should return 0 assigned count for empty todo IDs", async () => {
      const mockTagRepository = createMockTagRepository();
      const mockTodoRepository = createMockTodoRepository();

      // 空の配列の場合はbulkAssignTagToTodosが呼ばれないように修正
      mockTagRepository.bulkAssignTagToTodos = mock(() => Promise.resolve(0));

      const useCase = new BulkAssignTagUseCase(mockTagRepository, mockTodoRepository);

      const result = await useCase.execute({
        tagId: validTagId,
        todoIds: [],
      });

      expect(result.success).toBe(true);
      expect(result.assignedCount).toBe(0);
      expect(mockTagRepository.bulkAssignTagToTodos).not.toHaveBeenCalled();
    });

    it("should throw error if tag doesn't exist", async () => {
      const mockTagRepository = createMockTagRepository();
      const mockTodoRepository = createMockTodoRepository();
      const useCase = new BulkAssignTagUseCase(mockTagRepository, mockTodoRepository);

      await expect(
        useCase.execute({
          tagId: nonExistentTagId,
          todoIds: validTodoIds,
        }),
      ).rejects.toThrow(`Tag with ID '${nonExistentTagId}' not found`);
    });

    it("should throw error if any todo doesn't exist", async () => {
      const mockTagRepository = createMockTagRepository();
      const mockTodoRepository = createMockTodoRepository();
      const useCase = new BulkAssignTagUseCase(mockTagRepository, mockTodoRepository);

      await expect(
        useCase.execute({
          tagId: validTagId,
          todoIds: [...validTodoIds, nonExistentTodoId],
        }),
      ).rejects.toThrow(`Todo with ID '${nonExistentTodoId}' not found`);
    });
  });

  describe("BulkRemoveTagUseCase", () => {
    it("should remove tag from multiple todos", async () => {
      const mockTagRepository = createMockTagRepository();
      const mockTodoRepository = createMockTodoRepository();
      const useCase = new BulkRemoveTagUseCase(mockTagRepository, mockTodoRepository);

      const result = await useCase.execute({
        tagId: validTagId,
        todoIds: validTodoIds,
      });

      expect(result.success).toBe(true);
      expect(result.removedCount).toBe(2);
      expect(result.tag).toEqual({
        id: validTagId,
        name: "Work",
        color: "#FF5733",
      });
      expect(mockTagRepository.bulkRemoveTagFromTodos).toHaveBeenCalledWith(validTagId, validTodoIds);
    });

    it("should return 0 removed count for empty todo IDs", async () => {
      const mockTagRepository = createMockTagRepository();
      const mockTodoRepository = createMockTodoRepository();

      // 空の配列の場合はbulkRemoveTagFromTodosが呼ばれないように修正
      mockTagRepository.bulkRemoveTagFromTodos = mock(() => Promise.resolve(0));

      const useCase = new BulkRemoveTagUseCase(mockTagRepository, mockTodoRepository);

      const result = await useCase.execute({
        tagId: validTagId,
        todoIds: [],
      });

      expect(result.success).toBe(true);
      expect(result.removedCount).toBe(0);
      expect(mockTagRepository.bulkRemoveTagFromTodos).not.toHaveBeenCalled();
    });

    it("should throw error if tag doesn't exist", async () => {
      const mockTagRepository = createMockTagRepository();
      const mockTodoRepository = createMockTodoRepository();
      const useCase = new BulkRemoveTagUseCase(mockTagRepository, mockTodoRepository);

      await expect(
        useCase.execute({
          tagId: nonExistentTagId,
          todoIds: validTodoIds,
        }),
      ).rejects.toThrow(`Tag with ID '${nonExistentTagId}' not found`);
    });

    it("should throw error if any todo doesn't exist", async () => {
      const mockTagRepository = createMockTagRepository();
      const mockTodoRepository = createMockTodoRepository();
      const useCase = new BulkRemoveTagUseCase(mockTagRepository, mockTodoRepository);

      await expect(
        useCase.execute({
          tagId: validTagId,
          todoIds: [...validTodoIds, nonExistentTodoId],
        }),
      ).rejects.toThrow(`Todo with ID '${nonExistentTodoId}' not found`);
    });
  });
});
