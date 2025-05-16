import { describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { subtasks, todos } from "../src/db/schema";
import { createTestDb } from "./setup";
import { createMockSubtask, createMockTodo } from "./utils";

describe("Database operations", () => {
  describe("Todo operations", () => {
    it("should insert and retrieve a todo", async () => {
      const db = createTestDb();
      const mockTodo = createMockTodo();

      // Todoを挿入
      await db.insert(todos).values(mockTodo);

      // Todoを取得
      const retrievedTodo = await db.select().from(todos).where(eq(todos.id, mockTodo.id)).get();

      expect(retrievedTodo).toBeDefined();
      expect(retrievedTodo?.id).toBe(mockTodo.id);
      expect(retrievedTodo?.content).toBe(mockTodo.content);
    });

    it("should update a todo", async () => {
      const db = createTestDb();
      const mockTodo = createMockTodo();

      // Todoを挿入
      await db.insert(todos).values(mockTodo);

      // Todoを更新
      const updatedContent = "Updated Todo";
      await db.update(todos).set({ content: updatedContent }).where(eq(todos.id, mockTodo.id));

      // 更新されたTodoを取得
      const retrievedTodo = await db.select().from(todos).where(eq(todos.id, mockTodo.id)).get();

      expect(retrievedTodo).toBeDefined();
      expect(retrievedTodo?.content).toBe(updatedContent);
    });

    it("should delete a todo", async () => {
      const db = createTestDb();
      const mockTodo = createMockTodo();

      // Todoを挿入
      await db.insert(todos).values(mockTodo);

      // Todoを削除
      await db.delete(todos).where(eq(todos.id, mockTodo.id));

      // Todoが存在しないことを確認
      const retrievedTodo = await db.select().from(todos).where(eq(todos.id, mockTodo.id)).get();

      expect(retrievedTodo).toBeUndefined();
    });
  });

  describe("Subtask operations", () => {
    it("should insert and retrieve a subtask", async () => {
      const db = createTestDb();
      // 先にTodoを作成
      const mockTodo = createMockTodo();
      await db.insert(todos).values(mockTodo);

      // Subtaskを作成（Todoに関連付け）
      const mockSubtask = createMockSubtask({ todoId: mockTodo.id });
      await db.insert(subtasks).values(mockSubtask);

      // Subtaskを取得
      const retrievedSubtask = await db.select().from(subtasks).where(eq(subtasks.id, mockSubtask.id)).get();

      expect(retrievedSubtask).toBeDefined();
      expect(retrievedSubtask?.id).toBe(mockSubtask.id);
      expect(retrievedSubtask?.todoId).toBe(mockTodo.id);
      expect(retrievedSubtask?.title).toBe(mockSubtask.title);
    });

    it("should update a subtask", async () => {
      const db = createTestDb();
      // 先にTodoを作成
      const mockTodo = createMockTodo();
      await db.insert(todos).values(mockTodo);

      // Subtaskを作成
      const mockSubtask = createMockSubtask({ todoId: mockTodo.id });
      await db.insert(subtasks).values(mockSubtask);

      // Subtaskを更新
      const updatedTitle = "Updated Subtask";
      await db.update(subtasks).set({ title: updatedTitle }).where(eq(subtasks.id, mockSubtask.id));

      // 更新されたSubtaskを取得
      const retrievedSubtask = await db.select().from(subtasks).where(eq(subtasks.id, mockSubtask.id)).get();

      expect(retrievedSubtask).toBeDefined();
      expect(retrievedSubtask?.title).toBe(updatedTitle);
    });

    it("should delete a subtask", async () => {
      const db = createTestDb();
      // 先にTodoを作成
      const mockTodo = createMockTodo();
      await db.insert(todos).values(mockTodo);

      // Subtaskを作成
      const mockSubtask = createMockSubtask({ todoId: mockTodo.id });
      await db.insert(subtasks).values(mockSubtask);

      // Subtaskを削除
      await db.delete(subtasks).where(eq(subtasks.id, mockSubtask.id));

      // Subtaskが存在しないことを確認
      const retrievedSubtask = await db.select().from(subtasks).where(eq(subtasks.id, mockSubtask.id)).get();

      expect(retrievedSubtask).toBeUndefined();
    });

    it("should retrieve all subtasks for a todo", async () => {
      const db = createTestDb();
      // 先にTodoを作成
      const mockTodo = createMockTodo();
      await db.insert(todos).values(mockTodo);

      // 複数のSubtaskを作成
      const mockSubtask1 = createMockSubtask({ todoId: mockTodo.id, order: 1 });
      const mockSubtask2 = createMockSubtask({ todoId: mockTodo.id, order: 2 });
      const mockSubtask3 = createMockSubtask({ todoId: mockTodo.id, order: 3 });

      await db.insert(subtasks).values([mockSubtask1, mockSubtask2, mockSubtask3]);

      // Todoに関連するすべてのSubtaskを取得
      const retrievedSubtasks = await db.select().from(subtasks).where(eq(subtasks.todoId, mockTodo.id)).all();

      expect(retrievedSubtasks).toHaveLength(3);
      expect(retrievedSubtasks.map((s) => s.id)).toContain(mockSubtask1.id);
      expect(retrievedSubtasks.map((s) => s.id)).toContain(mockSubtask2.id);
      expect(retrievedSubtasks.map((s) => s.id)).toContain(mockSubtask3.id);
    });
  });
});
