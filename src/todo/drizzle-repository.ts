import { eq } from "drizzle-orm";
import { Todo } from "./model";
import { TodoRepository } from "./repository";
import { SubtaskRepository } from "../subtask/repository";
import * as schema from "../db/schema";

export class DrizzleTodoRepository implements TodoRepository {
  constructor(
    private db: any, // 一時的にany型で定義
    private subtaskRepository: SubtaskRepository
  ) {}

  async findAll(): Promise<Todo[]> {
    const todoRecords = await this.db.select().from(schema.todos).all();

    const todos: Todo[] = [];
    for (const record of todoRecords) {
      const subtasks = await this.subtaskRepository.findByTodoId(record.id);
      todos.push(
        new Todo(
          record.content,
          record.id,
          record.completed,
          record.createdAt,
          record.updatedAt,
          subtasks
        )
      );
    }

    return todos;
  }

  async findById(id: string): Promise<Todo | null> {
    const record = await this.db
      .select()
      .from(schema.todos)
      .where(eq(schema.todos.id, id))
      .get();

    if (!record) {
      return null;
    }

    const subtasks = await this.subtaskRepository.findByTodoId(id);

    return new Todo(
      record.content,
      record.id,
      record.completed,
      record.createdAt,
      record.updatedAt,
      subtasks
    );
  }

  async save(todo: Todo): Promise<Todo> {
    const existingTodo = await this.db
      .select()
      .from(schema.todos)
      .where(eq(schema.todos.id, todo.id))
      .get();

    const todoData = {
      id: todo.id,
      content: todo.content,
      completed: todo.completed,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };

    if (existingTodo) {
      await this.db
        .update(schema.todos)
        .set(todoData)
        .where(eq(schema.todos.id, todo.id));
    } else {
      await this.db.insert(schema.todos).values(todoData);
    }

    // Save all subtasks
    for (const subtask of todo.subtasks) {
      await this.subtaskRepository.save(subtask);
    }

    return todo;
  }

  async delete(id: string): Promise<void> {
    // Note: This assumes cascading delete for subtasks in the database
    await this.db.delete(schema.todos).where(eq(schema.todos.id, id));
  }
}
