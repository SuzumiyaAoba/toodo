import type { Context } from "hono";
import type { CreateTodoActivityUseCase } from "../../application/use-cases/todo-activity/create-todo-activity";
import type { DeleteTodoActivityUseCase } from "../../application/use-cases/todo-activity/delete-todo-activity";
import type { GetTodoActivityListUseCase } from "../../application/use-cases/todo-activity/get-todo-activity-list";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import type { CreateTodoActivityRequest } from "../schemas/todo-schemas";

/**
 * TodoActivityController handles HTTP requests related to TodoActivity entities
 */
export class TodoActivityController {
  constructor(
    private createTodoActivityUseCase: CreateTodoActivityUseCase,
    private getTodoActivityListUseCase: GetTodoActivityListUseCase,
    private deleteTodoActivityUseCase: DeleteTodoActivityUseCase,
  ) {}

  /**
   * Create a new TodoActivity
   */
  async create(c: Context) {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json") as CreateTodoActivityRequest;

    try {
      const activity = await this.createTodoActivityUseCase.execute(id, data);
      return c.json(activity, 201);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof InvalidStateTransitionError) {
        return c.json({ error: error.message }, 400);
      }
      throw error;
    }
  }

  /**
   * Get activities for a Todo
   */
  async getList(c: Context) {
    const { id } = c.req.valid("param");

    try {
      const activities = await this.getTodoActivityListUseCase.execute(id);
      return c.json(activities);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  }

  /**
   * Delete a TodoActivity
   */
  async delete(c: Context) {
    const { id, activityId } = c.req.valid("param");

    try {
      await this.deleteTodoActivityUseCase.execute(id, activityId);
      c.status(204);
      return c.body(null);
    } catch (error) {
      if (error instanceof TodoNotFoundError || error instanceof TodoActivityNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof UnauthorizedActivityDeletionError) {
        return c.json({ error: error.message }, 403);
      }
      throw error;
    }
  }
}
