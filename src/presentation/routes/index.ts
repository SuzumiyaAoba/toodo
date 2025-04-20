import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import type { CreateTodoActivityUseCase } from "../../application/use-cases/todo-activity/create-todo-activity";
import type { DeleteTodoActivityUseCase } from "../../application/use-cases/todo-activity/delete-todo-activity";
import type { GetTodoActivityListUseCase } from "../../application/use-cases/todo-activity/get-todo-activity-list";
import type { CreateTodoUseCase } from "../../application/use-cases/todo/create-todo";
import type { DeleteTodoUseCase } from "../../application/use-cases/todo/delete-todo";
import type { GetTodoUseCase } from "../../application/use-cases/todo/get-todo";
import type { GetTodoListUseCase } from "../../application/use-cases/todo/get-todo-list";
import type { GetTodoWorkTimeUseCase } from "../../application/use-cases/todo/get-todo-work-time";
import type { UpdateTodoUseCase } from "../../application/use-cases/todo/update-todo";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import {
  CreateTodoActivitySchema,
  CreateTodoSchema,
  IdParamSchema,
  TodoActivityIdParamSchema,
  UpdateTodoSchema,
} from "../schemas/todo-schemas";

/**
 * Setup API routes for the Todo application
 */
export function setupRoutes(
  // Todo use cases
  createTodoUseCase: CreateTodoUseCase,
  getTodoListUseCase: GetTodoListUseCase,
  getTodoUseCase: GetTodoUseCase,
  updateTodoUseCase: UpdateTodoUseCase,
  deleteTodoUseCase: DeleteTodoUseCase,
  getTodoWorkTimeUseCase: GetTodoWorkTimeUseCase,
  // TodoActivity use cases
  createTodoActivityUseCase: CreateTodoActivityUseCase,
  getTodoActivityListUseCase: GetTodoActivityListUseCase,
  deleteTodoActivityUseCase: DeleteTodoActivityUseCase,
): Hono {
  const app = new Hono();

  // Todo routes
  app.post("/todos", vValidator("json", CreateTodoSchema), async (c) => {
    const data = c.req.valid("json");
    const todo = await createTodoUseCase.execute(data);
    return c.json(todo, 201);
  });

  app.get("/todos", async (c) => {
    const todos = await getTodoListUseCase.execute();
    return c.json(todos);
  });

  app.get("/todos/:id", vValidator("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param");
    try {
      const todo = await getTodoUseCase.execute(id);
      return c.json(todo);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.put("/todos/:id", vValidator("param", IdParamSchema), vValidator("json", UpdateTodoSchema), async (c) => {
    const { id } = c.req.valid("param");
    const data = c.req.valid("json");

    try {
      const todo = await updateTodoUseCase.execute(id, data);
      return c.json(todo);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.delete("/todos/:id", vValidator("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    try {
      await deleteTodoUseCase.execute(id);
      c.status(204);
      return c.body(null);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.get("/todos/:id/work-time", vValidator("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const workTimeInfo = await getTodoWorkTimeUseCase.execute(id);
      return c.json(workTimeInfo);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  // TodoActivity routes
  app.post(
    "/todos/:id/activities",
    vValidator("param", IdParamSchema),
    vValidator("json", CreateTodoActivitySchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json");

      try {
        const activity = await createTodoActivityUseCase.execute(id, data);
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
    },
  );

  app.get("/todos/:id/activities", vValidator("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param");

    try {
      const activities = await getTodoActivityListUseCase.execute(id);
      return c.json(activities);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      throw error;
    }
  });

  app.delete("/todos/:id/activities/:activityId", vValidator("param", TodoActivityIdParamSchema), async (c) => {
    const { id, activityId } = c.req.valid("param");

    try {
      await deleteTodoActivityUseCase.execute(id, activityId);
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
  });

  return app;
}
