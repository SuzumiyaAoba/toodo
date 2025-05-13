import type { Context } from "hono";
import type { CreateTodoUseCase } from "../../application/use-cases/todo/create-todo";
import type { DeleteTodoUseCase } from "../../application/use-cases/todo/delete-todo";
import type { GetTodoUseCase } from "../../application/use-cases/todo/get-todo";
import type { GetTodoListUseCase } from "../../application/use-cases/todo/get-todo-list";
import type { GetTodoWorkTimeUseCase } from "../../application/use-cases/todo/get-todo-work-time";
import type { UpdateTodoUseCase } from "../../application/use-cases/todo/update-todo";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { CreateTodoRequest, UpdateTodoRequest } from "../schemas/todo-schemas";

/**
 * TodoController handles HTTP requests related to Todo entities
 */
export class TodoController {
  constructor(
    private createTodoUseCase: CreateTodoUseCase,
    private getTodoListUseCase: GetTodoListUseCase,
    private getTodoUseCase: GetTodoUseCase,
    private updateTodoUseCase: UpdateTodoUseCase,
    private deleteTodoUseCase: DeleteTodoUseCase,
    private getTodoWorkTimeUseCase: GetTodoWorkTimeUseCase,
  ) {}

  /**
   * Create a new Todo
   */
  async create(c: Context) {
    const data = c.req.valid("json") as CreateTodoRequest;
    const todo = await this.createTodoUseCase.execute(data);

    return c.json(todo, 201);
  }

  /**
   * Get all Todos
   */
  async getList(c: Context) {
    const todos = await this.getTodoListUseCase.execute();
    return c.json(todos);
  }

  /**
   * Get a specific Todo by ID
   */
  async getById(c: Context) {
    const { id } = c.req.valid("param");
    try {
      const todo = await this.getTodoUseCase.execute(id);
      return c.json(todo);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }

  /**
   * Update a Todo
   */
  async update(c: Context) {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json") as UpdateTodoRequest;

    try {
      const todo = await this.updateTodoUseCase.execute(id, data);
      return c.json(todo);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }

  /**
   * Delete a Todo
   */
  async delete(c: Context) {
    const { id } = c.req.valid("param");

    try {
      await this.deleteTodoUseCase.execute(id);
      c.status(204);
      return c.body(null);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }

  /**
   * Get work time information for a Todo
   */
  async getWorkTime(c: Context) {
    const { id } = c.req.valid("param");

    try {
      const workTimeInfo = await this.getTodoWorkTimeUseCase.execute(id);
      return c.json(workTimeInfo);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }
}
