import { describe, expect, it } from "bun:test";
import { eq, isNull } from "drizzle-orm";
import { tasks } from "../src/db/schema";
import { DrizzleTaskRepository } from "../src/infrastructure/repositories/DrizzleTaskRepository";
import { createTestDb } from "./setup";
import { createMockChildTask, createMockTask } from "./utils";

describe("Database operations", () => {
	describe("Task operations", () => {
		it("should insert and retrieve a task", async () => {
			const db = createTestDb();
			const mockTask = createMockTask();

			// Insert Task
			await db.insert(tasks).values(mockTask);

			// Retrieve Task
			const retrievedTask = await db
				.select()
				.from(tasks)
				.where(eq(tasks.id, mockTask.id))
				.get();

			expect(retrievedTask).toBeDefined();
			expect(retrievedTask?.id).toBe(mockTask.id);
			expect(retrievedTask?.title).toBe(mockTask.title);
			expect(retrievedTask?.parentId).toBeNull();
		});

		it("should update a task", async () => {
			const db = createTestDb();
			const mockTask = createMockTask();

			// Insert Task
			await db.insert(tasks).values(mockTask);

			// Update Task
			const updatedTitle = "Updated Task";
			await db
				.update(tasks)
				.set({ title: updatedTitle })
				.where(eq(tasks.id, mockTask.id));

			// Retrieve updated Task
			const retrievedTask = await db
				.select()
				.from(tasks)
				.where(eq(tasks.id, mockTask.id))
				.get();

			expect(retrievedTask).toBeDefined();
			expect(retrievedTask?.title).toBe(updatedTitle);
		});

		it("should delete a task", async () => {
			const db = createTestDb();
			const mockTask = createMockTask();

			// Insert Task
			await db.insert(tasks).values(mockTask);

			// Delete Task
			await db.delete(tasks).where(eq(tasks.id, mockTask.id));

			// Verify Task no longer exists
			const retrievedTask = await db
				.select()
				.from(tasks)
				.where(eq(tasks.id, mockTask.id))
				.get();

			expect(retrievedTask).toBeUndefined();
		});
	});

	describe("Task hierarchy operations", () => {
		it("should insert and retrieve child tasks", async () => {
			const db = createTestDb();

			// Create parent task first
			const parentTask = createMockTask();
			await db.insert(tasks).values(parentTask);

			// Create child task
			const childTask = createMockChildTask(parentTask.id);
			await db.insert(tasks).values(childTask);

			// Retrieve child task
			const retrievedChildTask = await db
				.select()
				.from(tasks)
				.where(eq(tasks.id, childTask.id))
				.get();

			expect(retrievedChildTask).toBeDefined();
			expect(retrievedChildTask?.id).toBe(childTask.id);
			expect(retrievedChildTask?.parentId).toBe(parentTask.id);
			expect(retrievedChildTask?.title).toBe(childTask.title);
		});

		it("should retrieve all child tasks for a parent", async () => {
			const db = createTestDb();

			// Create parent task first
			const parentTask = createMockTask();
			await db.insert(tasks).values(parentTask);

			// Create multiple child tasks
			const childTask1 = createMockChildTask(parentTask.id, { order: 1 });
			const childTask2 = createMockChildTask(parentTask.id, { order: 2 });
			const childTask3 = createMockChildTask(parentTask.id, { order: 3 });

			await db.insert(tasks).values([childTask1, childTask2, childTask3]);

			// Retrieve all child tasks
			const retrievedChildTasks = await db
				.select()
				.from(tasks)
				.where(eq(tasks.parentId, parentTask.id))
				.all();

			expect(retrievedChildTasks).toHaveLength(3);
			expect(retrievedChildTasks.map((t) => t.id)).toContain(childTask1.id);
			expect(retrievedChildTasks.map((t) => t.id)).toContain(childTask2.id);
			expect(retrievedChildTasks.map((t) => t.id)).toContain(childTask3.id);
		});

		it("should retrieve all root tasks", async () => {
			const db = createTestDb();

			// Create multiple root tasks
			const rootTask1 = createMockTask({ order: 1 });
			const rootTask2 = createMockTask({ order: 2 });
			const rootTask3 = createMockTask({ order: 3 });

			await db.insert(tasks).values([rootTask1, rootTask2, rootTask3]);

			// Create a child task (should not be returned with root tasks)
			const childTask = createMockChildTask(rootTask1.id);
			await db.insert(tasks).values(childTask);

			// Retrieve all root tasks
			const retrievedRootTasks = await db
				.select()
				.from(tasks)
				.where(isNull(tasks.parentId))
				.all();

			expect(retrievedRootTasks).toHaveLength(3);
			expect(retrievedRootTasks.map((t) => t.id)).toContain(rootTask1.id);
			expect(retrievedRootTasks.map((t) => t.id)).toContain(rootTask2.id);
			expect(retrievedRootTasks.map((t) => t.id)).toContain(rootTask3.id);
			expect(retrievedRootTasks.map((t) => t.id)).not.toContain(childTask.id);

			// Verify root tasks are ordered correctly
			const sortedRootTasks = [...retrievedRootTasks].sort(
				(a, b) => a.order - b.order,
			);
			expect(sortedRootTasks[0].id).toBe(rootTask1.id);
			expect(sortedRootTasks[1].id).toBe(rootTask2.id);
			expect(sortedRootTasks[2].id).toBe(rootTask3.id);
		});

		it("should prevent circular references when moving tasks", async () => {
			const db = createTestDb();
			const taskRepository = new DrizzleTaskRepository(db);

			// Create parent task
			const parentTaskRecord = createMockTask({ title: "Parent Task" });
			await db.insert(tasks).values(parentTaskRecord);
			const parentTask = await taskRepository.findById(parentTaskRecord.id);

			// Create child task with parentId set to parent task id
			const childTaskRecord = createMockTask({
				title: "Child Task",
				parentId: parentTaskRecord.id,
			});
			await db.insert(tasks).values(childTaskRecord);
			const childTask = await taskRepository.findById(childTaskRecord.id);

			// Create grandchild task with parentId set to child task id
			const grandchildTaskRecord = createMockTask({
				title: "Grandchild Task",
				parentId: childTaskRecord.id,
			});
			await db.insert(tasks).values(grandchildTaskRecord);
			const grandchildTask = await taskRepository.findById(
				grandchildTaskRecord.id,
			);

			// Attempt to move parent to be a child of its own grandchild (should throw)
			await expect(
				taskRepository.moveTask(parentTaskRecord.id, grandchildTaskRecord.id),
			).rejects.toThrow("Cannot move a task to its own descendant");

			// Attempt to make a task its own parent (should throw)
			await expect(
				taskRepository.moveTask(parentTaskRecord.id, parentTaskRecord.id),
			).rejects.toThrow("Cannot set a task as its own parent");

			// Valid move should work
			const movedTask = await taskRepository.moveTask(
				grandchildTaskRecord.id,
				null,
			);
			expect(movedTask).not.toBeNull();
			expect(movedTask?.parentId).toBeNull();
		});

		it("should delete child tasks when parent is deleted", async () => {
			const db = createTestDb();

			// Create parent task
			const parentTask = createMockTask();
			await db.insert(tasks).values(parentTask);

			// Create child task
			const childTask = createMockChildTask(parentTask.id);
			await db.insert(tasks).values(childTask);

			// Verify child task exists
			const retrievedChildTask = await db
				.select()
				.from(tasks)
				.where(eq(tasks.id, childTask.id))
				.get();
			expect(retrievedChildTask).toBeDefined();

			// Delete parent task
			await db.delete(tasks).where(eq(tasks.id, parentTask.id));

			// Verify child task no longer exists
			const deletedChildTask = await db
				.select()
				.from(tasks)
				.where(eq(tasks.id, childTask.id))
				.get();
			expect(deletedChildTask).toBeUndefined();
		});
	});
});
