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

      // Insert Todo
      await db.insert(todos).values(mockTodo);

      // Retrieve Todo
      const retrievedTodo = await db.select().from(todos).where(eq(todos.id, mockTodo.id)).get();

      expect(retrievedTodo).toBeDefined();
      expect(retrievedTodo?.id).toBe(mockTodo.id);
      expect(retrievedTodo?.content).toBe(mockTodo.content);
    });

    it("should update a todo", async () => {
      const db = createTestDb();
      const mockTodo = createMockTodo();

      // Insert Todo
      await db.insert(todos).values(mockTodo);

      // Update Todo
      const updatedContent = "Updated Todo";
      await db.update(todos).set({ content: updatedContent }).where(eq(todos.id, mockTodo.id));

      // Retrieve updated Todo
      const retrievedTodo = await db.select().from(todos).where(eq(todos.id, mockTodo.id)).get();

      expect(retrievedTodo).toBeDefined();
      expect(retrievedTodo?.content).toBe(updatedContent);
    });

    it("should delete a todo", async () => {
      const db = createTestDb();
      const mockTodo = createMockTodo();

      // Insert Todo
      await db.insert(todos).values(mockTodo);

      // Delete Todo
      await db.delete(todos).where(eq(todos.id, mockTodo.id));

      // Verify Todo no longer exists
      const retrievedTodo = await db.select().from(todos).where(eq(todos.id, mockTodo.id)).get();

      expect(retrievedTodo).toBeUndefined();
    });
  });

  describe("Subtask operations", () => {
    it("should insert and retrieve a subtask", async () => {
      const db = createTestDb();
      // Create Todo first
      const mockTodo = createMockTodo();
      await db.insert(todos).values(mockTodo);

      // Create Subtask (linked to Todo)
      const mockSubtask = createMockSubtask({ todoId: mockTodo.id });
      await db.insert(subtasks).values(mockSubtask);

      // Retrieve Subtask
      const retrievedSubtask = await db.select().from(subtasks).where(eq(subtasks.id, mockSubtask.id)).get();

      expect(retrievedSubtask).toBeDefined();
      expect(retrievedSubtask?.id).toBe(mockSubtask.id);
      expect(retrievedSubtask?.todoId).toBe(mockTodo.id);
      expect(retrievedSubtask?.title).toBe(mockSubtask.title);
    });

    it("should update a subtask", async () => {
      const db = createTestDb();
      // Create Todo first
      const mockTodo = createMockTodo();
      await db.insert(todos).values(mockTodo);

      // Create Subtask
      const mockSubtask = createMockSubtask({ todoId: mockTodo.id });
      await db.insert(subtasks).values(mockSubtask);

      // Update Subtask
      const updatedTitle = "Updated Subtask";
      await db.update(subtasks).set({ title: updatedTitle }).where(eq(subtasks.id, mockSubtask.id));

      // Retrieve updated Subtask
      const retrievedSubtask = await db.select().from(subtasks).where(eq(subtasks.id, mockSubtask.id)).get();

      expect(retrievedSubtask).toBeDefined();
      expect(retrievedSubtask?.title).toBe(updatedTitle);
    });

    it("should delete a subtask", async () => {
      const db = createTestDb();
      // Create Todo first
      const mockTodo = createMockTodo();
      await db.insert(todos).values(mockTodo);

      // Create Subtask
      const mockSubtask = createMockSubtask({ todoId: mockTodo.id });
      await db.insert(subtasks).values(mockSubtask);

      // Delete Subtask
      await db.delete(subtasks).where(eq(subtasks.id, mockSubtask.id));

      // Verify Subtask no longer exists
      const retrievedSubtask = await db.select().from(subtasks).where(eq(subtasks.id, mockSubtask.id)).get();

      expect(retrievedSubtask).toBeUndefined();
    });

    it("should retrieve all subtasks for a todo", async () => {
      const db = createTestDb();
      // Create Todo first
      const mockTodo = createMockTodo();
      await db.insert(todos).values(mockTodo);

      // Create multiple Subtasks
      const mockSubtask1 = createMockSubtask({ todoId: mockTodo.id, order: 1 });
      const mockSubtask2 = createMockSubtask({ todoId: mockTodo.id, order: 2 });
      const mockSubtask3 = createMockSubtask({ todoId: mockTodo.id, order: 3 });

      await db.insert(subtasks).values([mockSubtask1, mockSubtask2, mockSubtask3]);

      // Retrieve all Subtasks related to Todo
      const retrievedSubtasks = await db.select().from(subtasks).where(eq(subtasks.todoId, mockTodo.id)).all();

      expect(retrievedSubtasks).toHaveLength(3);
      expect(retrievedSubtasks.map((s) => s.id)).toContain(mockSubtask1.id);
      expect(retrievedSubtasks.map((s) => s.id)).toContain(mockSubtask2.id);
      expect(retrievedSubtasks.map((s) => s.id)).toContain(mockSubtask3.id);
    });
  });
});
