import { asc, eq, isNull } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "../../db/schema";
import { Task, type TaskStatus } from "../../domain/models/Task";
import type { TaskRepository } from "../../domain/repositories/TaskRepository";

type DbSchema = typeof schema;

export class DrizzleTaskRepository implements TaskRepository {
  constructor(private db: BunSQLiteDatabase<DbSchema>) {}

  async findRootTasks(): Promise<Task[]> {
    const records = await this.db
      .select()
      .from(schema.tasks)
      .where(isNull(schema.tasks.parentId))
      .orderBy(asc(schema.tasks.order))
      .all();

    const tasks: Task[] = [];
    for (const record of records) {
      const subtasks = await this.findByParentId(record.id as string);
      tasks.push(this.mapToModel(record as schema.Task, subtasks));
    }

    return tasks;
  }

  async findByParentId(parentId: string): Promise<Task[]> {
    const records = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.parentId, parentId))
      .orderBy(asc(schema.tasks.order))
      .all();

    const tasks: Task[] = [];
    for (const record of records) {
      const subtasks = await this.findByParentId(record.id as string);
      tasks.push(this.mapToModel(record as schema.Task, subtasks));
    }

    return tasks;
  }

  async findById(id: string, loadHierarchy = true): Promise<Task | null> {
    const record = await this.db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get();

    if (!record) {
      return null;
    }

    const subtasks = loadHierarchy ? await this.findByParentId(id) : [];
    return this.mapToModel(record as schema.Task, subtasks);
  }

  async save(task: Task, saveHierarchy = true): Promise<Task> {
    const existingTask = await this.db.select().from(schema.tasks).where(eq(schema.tasks.id, task.id)).get();

    const taskData = {
      id: task.id,
      parentId: task.parentId,
      title: task.title,
      description: task.description,
      status: task.status,
      order: task.order,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    if (existingTask) {
      await this.db.update(schema.tasks).set(taskData).where(eq(schema.tasks.id, task.id));
    } else {
      await this.db.insert(schema.tasks).values(taskData);
    }

    if (saveHierarchy) {
      // Save all subtasks
      for (const subtask of task.subtasks) {
        await this.save(subtask, true);
      }
    }

    return task;
  }

  async delete(id: string): Promise<void> {
    // First, handle subtasks recursively
    const subtasks = await this.findByParentId(id);
    for (const subtask of subtasks) {
      await this.delete(subtask.id);
    }

    // Then delete the task itself
    await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  }

  async updateOrder(tasks: Task[]): Promise<Task[]> {
    // Ensure all tasks are siblings (have the same parent)
    const parentIds = new Set(tasks.map((task) => task.parentId));
    if (parentIds.size !== 1) {
      throw new Error("All tasks must have the same parent");
    }

    for (const [index, task] of tasks.entries()) {
      task.order = index + 1;
      await this.db
        .update(schema.tasks)
        .set({ order: task.order, updatedAt: new Date() })
        .where(eq(schema.tasks.id, task.id));
    }

    return tasks;
  }

  async findTaskTree(rootId: string): Promise<Task | null> {
    return this.findById(rootId, true);
  }

  async moveTask(taskId: string, newParentId: string | null): Promise<Task | null> {
    const task = await this.findById(taskId, false);
    if (!task) {
      return null;
    }

    // If new parent is specified, validate it exists
    if (newParentId) {
      const newParent = await this.findById(newParentId, false);
      if (!newParent) {
        return null;
      }

      // Check if new parent is not a descendant of the task
      // (to prevent circular references)
      if (await this.isDescendant(newParentId, taskId)) {
        throw new Error("Cannot move a task to its own descendant");
      }
    }

    // Get sibling tasks at the new location to determine correct order
    const siblingTasks = await this.db
      .select()
      .from(schema.tasks)
      .where(newParentId ? eq(schema.tasks.parentId, newParentId) : isNull(schema.tasks.parentId))
      .all();

    // Calculate new order as last item
    const newOrder = siblingTasks.length > 0 ? Math.max(...siblingTasks.map((t) => (t as schema.Task).order)) + 1 : 1;

    // Update the task
    task.parentId = newParentId;
    task.order = newOrder;
    task.updatedAt = new Date();

    await this.db
      .update(schema.tasks)
      .set({
        parentId: task.parentId,
        order: task.order,
        updatedAt: task.updatedAt,
      })
      .where(eq(schema.tasks.id, taskId));

    return this.findById(taskId, true);
  }

  private async isDescendant(taskId: string, potentialAncestorId: string): Promise<boolean> {
    const task = await this.findById(taskId, false);
    if (!task || !task.parentId) {
      return false;
    }

    if (task.parentId === potentialAncestorId) {
      return true;
    }

    return this.isDescendant(task.parentId, potentialAncestorId);
  }

  private mapToModel(record: schema.Task, subtasks: Task[] = []): Task {
    return new Task(
      record.title,
      record.parentId,
      record.description,
      record.id,
      record.status as TaskStatus,
      record.order,
      record.createdAt,
      record.updatedAt ?? new Date(),
      subtasks,
    );
  }
}
