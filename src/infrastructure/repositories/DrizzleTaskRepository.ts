import { asc, eq, inArray, isNull } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { inject, injectable, singleton } from "tsyringe";
import * as schema from "../../db/schema";
import { Task as TaskNamespace, type TaskStatus } from "../../domain/models/Task";
import type { Task } from "../../domain/models/Task";
import type { PaginationParams, TaskRepository } from "../../domain/repositories/TaskRepository";

type DbSchema = typeof schema;

@injectable()
@singleton()
export class DrizzleTaskRepository implements TaskRepository {
  constructor(@inject("DB") private readonly db: BunSQLiteDatabase<DbSchema>) {}

  async findRootTasks(): Promise<readonly Task[]> {
    const records = await this.db
      .select()
      .from(schema.tasks)
      .where(isNull(schema.tasks.parentId))
      .orderBy(asc(schema.tasks.order))
      .all();

    return this.mapRecordsToTasks(records as schema.Task[]);
  }

  async findRootTasksWithPagination(params: PaginationParams): Promise<readonly Task[]> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    const records = await this.db
      .select()
      .from(schema.tasks)
      .where(isNull(schema.tasks.parentId))
      .orderBy(asc(schema.tasks.order))
      .limit(limit)
      .offset(offset)
      .all();

    return this.mapRecordsToTasks(records as schema.Task[]);
  }

  async findByParentId(parentId: string): Promise<readonly Task[]> {
    const records = await this.db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.parentId, parentId))
      .orderBy(asc(schema.tasks.order))
      .all();

    return this.mapRecordsToTasks(records as schema.Task[]);
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
    } as const;

    if (existingTask) {
      await this.db.update(schema.tasks).set(taskData).where(eq(schema.tasks.id, task.id));
    } else {
      await this.db.insert(schema.tasks).values(taskData);
    }

    if (saveHierarchy) {
      for (const subtask of task.subtasks) {
        await this.save(subtask, true);
      }
    }

    const updated = await this.findById(task.id, saveHierarchy);
    return updated || task;
  }

  async delete(id: string): Promise<void> {
    const subtasks = await this.findByParentId(id);

    for (const subtask of subtasks) {
      await this.delete(subtask.id);
    }

    await this.db.delete(schema.tasks).where(eq(schema.tasks.id, id));
  }

  async updateOrder(tasks: readonly Task[]): Promise<readonly Task[]> {
    await this.db.transaction(async (tx) => {
      for (const task of tasks) {
        await tx
          .update(schema.tasks)
          .set({ order: task.order, updatedAt: new Date() })
          .where(eq(schema.tasks.id, task.id));
      }
    });

    // Serialize findById calls to avoid potential race conditions
    const updatedTasks: Task[] = [];
    for (const task of tasks) {
      const updatedTask = await this.findById(task.id, false);
      if (updatedTask) {
        updatedTasks.push(updatedTask);
      }
    }

    return updatedTasks;
  }

  async findTaskTree(rootId: string): Promise<Task | null> {
    return this.findById(rootId, true);
  }

  async moveTask(taskId: string, newParentId: string | null): Promise<Task | null> {
    const task = await this.findById(taskId, false);
    if (!task) {
      return null;
    }

    if (newParentId) {
      const newParent = await this.findById(newParentId, false);
      if (!newParent) {
        return null;
      }

      if (await this.isDescendant(newParentId, taskId)) {
        throw new Error("Cannot move a task to its own descendant");
      }
    }

    const siblingTasks = await this.db
      .select()
      .from(schema.tasks)
      .where(newParentId ? eq(schema.tasks.parentId, newParentId) : isNull(schema.tasks.parentId))
      .all();

    const newOrder = siblingTasks.length > 0 ? Math.max(...siblingTasks.map((t) => (t as schema.Task).order)) + 1 : 1;

    const updatedTask = TaskNamespace.create(
      task.title,
      newParentId,
      task.description,
      task.id,
      task.status,
      newOrder,
      task.createdAt,
      new Date(),
      task.subtasks,
    );

    await this.db
      .update(schema.tasks)
      .set({
        parentId: updatedTask.parentId,
        order: updatedTask.order,
        updatedAt: updatedTask.updatedAt,
      })
      .where(eq(schema.tasks.id, taskId));

    return this.findById(taskId, true);
  }

  private async isDescendant(potentialDescendantId: string, ancestorId: string): Promise<boolean> {
    const potentialDescendant = await this.findById(potentialDescendantId, false);
    if (!potentialDescendant) {
      return false;
    }

    if (potentialDescendant.parentId === ancestorId) {
      return true;
    }

    if (potentialDescendant.parentId) {
      return this.isDescendant(potentialDescendant.parentId, ancestorId);
    }

    return false;
  }

  private mapToModel(record: schema.Task, subtasks: readonly Task[] = []): Task {
    return TaskNamespace.create(
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

  private async mapRecordsToTasks(records: schema.Task[]): Promise<readonly Task[]> {
    if (records.length === 0) {
      return [];
    }

    // Extract all record IDs
    const parentIds = records.map((record) => record.id);

    // Fetch all subtasks for all parent IDs in a single query
    const allSubtasksRecords = (await this.db
      .select()
      .from(schema.tasks)
      .where(inArray(schema.tasks.parentId, parentIds))
      .orderBy(asc(schema.tasks.order))
      .all()) as schema.Task[];

    // Create a map of parentId -> subtasks records
    const subtasksByParentId = new Map<string, schema.Task[]>();

    // Initialize empty arrays for all parent IDs
    for (const id of parentIds) {
      subtasksByParentId.set(id, []);
    }

    // Group subtasks by their parent ID
    for (const subtask of allSubtasksRecords) {
      if (subtask.parentId) {
        const parentSubtasks = subtasksByParentId.get(subtask.parentId) || [];
        parentSubtasks.push(subtask);
        subtasksByParentId.set(subtask.parentId, parentSubtasks);
      }
    }

    // Process subtasks recursively for each level
    const subtaskEntries = Array.from(subtasksByParentId.entries());
    if (subtaskEntries.length > 0) {
      // Recursive call to process nested subtasks
      const processedSubtasks = await this.mapRecordsToTasks(allSubtasksRecords);

      // Create a map of subtask ID -> processed subtask with its own children
      const processedSubtasksById = new Map<string, Task>();
      for (const subtask of processedSubtasks) {
        processedSubtasksById.set(subtask.id, subtask);
      }

      // Map record to task model with all subtasks
      const tasks: Task[] = records.map((record) => {
        const recordSubtasks = subtasksByParentId.get(record.id) || [];
        const mappedSubtasks: Task[] = recordSubtasks.map((subtaskRecord) => {
          // Use the already processed subtask if available (with its own children)
          return (
            processedSubtasksById.get(subtaskRecord.id) ||
            // Fallback to creating a new task without children if not found
            this.mapToModel(subtaskRecord, [])
          );
        });

        return this.mapToModel(record, mappedSubtasks);
      });

      return Object.freeze(tasks);
    }

    // If there are no subtasks, just map the records to tasks without children
    const tasks: Task[] = records.map((record) => this.mapToModel(record, []));
    return Object.freeze(tasks);
  }
}
