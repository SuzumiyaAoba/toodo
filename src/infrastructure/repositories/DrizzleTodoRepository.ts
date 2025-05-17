import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { todos } from "../../db/schema";
import type * as schema from "../../db/schema";
import { Todo as TodoNamespace } from "../../domain/models/Todo";
import type { Todo } from "../../domain/models/Todo";
import type { SubtaskRepository } from "../../domain/repositories/SubtaskRepository";
import type { TodoRepository } from "../../domain/repositories/TodoRepository";

type DbSchema = typeof schema;

export class DrizzleTodoRepository implements TodoRepository {
  constructor(
    private db: BunSQLiteDatabase<DbSchema>,
    private subtaskRepository: SubtaskRepository,
  ) {}

  async findAll(): Promise<Todo[]> {
    const todoRecords = await this.db.select().from(todos).all();

    const result: Todo[] = [];
    for (const record of todoRecords) {
      const subtasks = await this.subtaskRepository.findByTodoId(record.id);
      result.push(
        TodoNamespace.create(
          record.content,
          record.id,
          record.completed,
          record.createdAt,
          record.updatedAt ?? new Date(),
          subtasks,
        ),
      );
    }

    return result;
  }

  async findById(id: string): Promise<Todo | null> {
    const record = await this.db.select().from(todos).where(eq(todos.id, id)).get();

    if (!record) {
      return null;
    }

    const subtasks = await this.subtaskRepository.findByTodoId(id);

    return TodoNamespace.create(
      record.content,
      record.id,
      record.completed,
      record.createdAt,
      record.updatedAt ?? new Date(),
      subtasks,
    );
  }

  async save(todo: Todo): Promise<Todo> {
    const existingTodo = await this.db.select().from(todos).where(eq(todos.id, todo.id)).get();

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

    // To return the object in the most up-to-date state, call findById again
    const updated = await this.findById(todo.id);

    // Return the original object if no data is found
    return updated || todo;
  }

  async delete(id: string): Promise<void> {
    // Note: This assumes cascading delete for subtasks in the database
    await this.db.delete(todos).where(eq(todos.id, id));
  }
}
