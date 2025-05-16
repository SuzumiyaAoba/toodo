import { asc, eq } from "drizzle-orm";
import { Subtask, SubtaskStatus } from "../../domain/models/Subtask";
import { SubtaskRepository } from "../../domain/repositories/SubtaskRepository";
import * as schema from "../../db/schema";

export class DrizzleSubtaskRepository implements SubtaskRepository {
  constructor(private db: any) {} // 一時的にany型で定義

  async findByTodoId(todoId: string): Promise<Subtask[]> {
    const records = await this.db
      .select()
      .from(schema.subtasks)
      .where(eq(schema.subtasks.todoId, todoId))
      .orderBy(asc(schema.subtasks.order))
      .all();

    return records.map(
      (record: {
        id: string;
        todoId: string;
        title: string;
        description: string | null;
        status: string;
        order: number;
        createdAt: Date;
        updatedAt: Date;
      }) =>
        new Subtask(
          record.todoId,
          record.title,
          record.order,
          record.description,
          record.id,
          record.status as SubtaskStatus,
          record.createdAt,
          record.updatedAt
        )
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
