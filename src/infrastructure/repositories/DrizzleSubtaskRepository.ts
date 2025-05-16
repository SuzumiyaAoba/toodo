import { asc, eq } from "drizzle-orm";
import { Subtask, SubtaskStatus } from "../../domain/models/Subtask";
import type { SubtaskRepository } from "../../domain/repositories/SubtaskRepository";
import { subtasks } from "../../db/schema";
import { BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { v4 as uuidv4 } from "uuid";
import * as schema from "../../db/schema";

export class DrizzleSubtaskRepository implements SubtaskRepository {
  constructor(private db: any) {}

  async findByTodoId(todoId: string): Promise<Subtask[]> {
    const result = await this.db
      .select()
      .from(schema.subtasks)
      .where(eq(schema.subtasks.todoId, todoId))
      .orderBy(asc(schema.subtasks.order));
    return result.map(this.mapToModel);
  }

  private mapToModel(record: {
    id: string;
    todoId: string;
    title: string;
    description: string | null;
    status: "completed" | "incomplete";
    order: number;
    createdAt: Date;
    updatedAt: Date | null;
  }): Subtask {
    const updatedAt = record.updatedAt || new Date();
    return new Subtask(
      record.todoId,
      record.title,
      record.order,
      record.description,
      record.id,
      record.status as SubtaskStatus,
      record.createdAt,
      updatedAt
    );
  }

  async findById(id: string): Promise<Subtask | null> {
    const record = await this.db
      .select()
      .from(schema.subtasks)
      .where(eq(schema.subtasks.id, id))
      .get();

    if (!record) {
      return null;
    }

    return new Subtask(
      record.todoId,
      record.title,
      record.order,
      record.description,
      record.id,
      record.status as SubtaskStatus,
      record.createdAt,
      record.updatedAt
    );
  }

  async save(subtask: Subtask): Promise<Subtask> {
    const existingSubtask = await this.db
      .select()
      .from(schema.subtasks)
      .where(eq(schema.subtasks.id, subtask.id))
      .get();

    const subtaskData = {
      id: subtask.id,
      todoId: subtask.todoId,
      title: subtask.title,
      description: subtask.description,
      status: subtask.status,
      order: subtask.order,
      createdAt: subtask.createdAt,
      updatedAt: subtask.updatedAt,
    };

    if (existingSubtask) {
      await this.db
        .update(schema.subtasks)
        .set(subtaskData)
        .where(eq(schema.subtasks.id, subtask.id));
    } else {
      await this.db.insert(schema.subtasks).values(subtaskData);
    }

    return subtask;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.subtasks).where(eq(schema.subtasks.id, id));
  }

  async updateOrder(subtasks: Subtask[]): Promise<Subtask[]> {
    for (const subtask of subtasks) {
      await this.save(subtask);
    }
    return subtasks;
  }
}
