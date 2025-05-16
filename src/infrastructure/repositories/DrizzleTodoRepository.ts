import { eq } from "drizzle-orm";
import { Todo } from "../../domain/models/Todo";
import type { TodoRepository } from "../../domain/repositories/TodoRepository";
import { todos } from "../../db/schema";
import type { SubtaskRepository } from "../../domain/repositories/SubtaskRepository";
import { BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

export class DrizzleTodoRepository implements TodoRepository {
  constructor(private db: any, private subtaskRepository: SubtaskRepository) {}

  async findAll(): Promise<Todo[]> {
    const todoRecords = await this.db.select().from(todos).all();

    const result: Todo[] = [];
    for (const record of todoRecords) {
      const subtasks = await this.subtaskRepository.findByTodoId(record.id);
      const updatedAt = record.updatedAt || new Date();
      result.push(
        new Todo(
          record.content,
          record.id,
          record.completed,
          record.createdAt,
          updatedAt,
          subtasks
        )
      );
    }

    return result;
  }

  async findById(id: string): Promise<Todo | null> {
    const record = await this.db
      .select()
      .from(todos)
      .where(eq(todos.id, id))
      .get();

    if (!record) {
      return null;
    }

    const subtasks = await this.subtaskRepository.findByTodoId(id);
    const updatedAt = record.updatedAt || new Date();

    return new Todo(
      record.content,
      record.id,
      record.completed,
      record.createdAt,
      updatedAt,
      subtasks
    );
  }

  async save(todo: Todo): Promise<Todo> {
    const existingTodo = await this.db
      .select()
      .from(todos)
      .where(eq(todos.id, todo.id))
      .get();

    const todoData = {
      id: todo.id,
      content: todo.content,
      completed: todo.completed,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };

    if (existingTodo) {
      await this.db.update(todos).set(todoData).where(eq(todos.id, todo.id));
    } else {
      await this.db.insert(todos).values(todoData);
    }

    // Save all subtasks
    for (const subtask of todo.subtasks) {
      await this.subtaskRepository.save(subtask);
    }

    return todo;
  }

  async delete(id: string): Promise<void> {
    // Note: This assumes cascading delete for subtasks in the database
    await this.db.delete(todos).where(eq(todos.id, id));
  }
}
