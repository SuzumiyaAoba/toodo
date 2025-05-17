import { asc, eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "../../db/schema";
import { Subtask as SubtaskNamespace, type SubtaskStatus } from "../../domain/models/Subtask";
import type { Subtask } from "../../domain/models/Subtask";
import type { SubtaskRepository } from "../../domain/repositories/SubtaskRepository";

type DbSchema = typeof schema;

export class DrizzleSubtaskRepository implements SubtaskRepository {
  constructor(private db: BunSQLiteDatabase<DbSchema>) {}

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
    return SubtaskNamespace.create(
      record.todoId,
      record.title,
      record.order,
      record.description,
      record.id,
      record.status as SubtaskStatus,
      record.createdAt,
      record.updatedAt ?? new Date(),
    );
  }

  async findById(id: string): Promise<Subtask | null> {
    const record = await this.db.select().from(schema.subtasks).where(eq(schema.subtasks.id, id)).get();

    if (!record) {
      return null;
    }

    return this.mapToModel(record);
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
      await this.db.update(schema.subtasks).set(subtaskData).where(eq(schema.subtasks.id, subtask.id));
    } else {
      await this.db.insert(schema.subtasks).values(subtaskData);
    }

    // 確実に最新の状態のオブジェクトを返すため、再度 findById を呼び出します
    return this.findById(subtask.id).then((updated) => {
      if (!updated) {
        // データがない場合は元のオブジェクトを返す
        return subtask;
      }
      return updated;
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(schema.subtasks).where(eq(schema.subtasks.id, id));
  }

  async updateOrder(subtasks: Subtask[]): Promise<Subtask[]> {
    const updatedSubtasks: Subtask[] = [];

    for (const subtask of subtasks) {
      const updated = await this.save(subtask);
      updatedSubtasks.push(updated);
    }

    return updatedSubtasks;
  }
}
