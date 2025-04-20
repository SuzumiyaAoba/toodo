import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import type { TodoActivityController } from "../controllers/todo-activity-controller";
import type { TodoController } from "../controllers/todo-controller";
import {
  CreateTodoActivitySchema,
  CreateTodoSchema,
  IdParamSchema,
  TodoActivityIdParamSchema,
  UpdateTodoSchema,
} from "../schemas/todo-schemas";

/**
 * Setup API routes for the Todo application
 *
 * @param todoController TodoController instance
 * @param todoActivityController TodoActivityController instance
 * @returns Hono app with routes configured
 */
export function setupRoutes(todoController: TodoController, todoActivityController: TodoActivityController): Hono {
  const app = new Hono();

  // Todo routes
  app.post("/todos", vValidator("json", CreateTodoSchema), (c) => todoController.create(c));
  app.get("/todos", (c) => todoController.getList(c));
  app.get("/todos/:id", vValidator("param", IdParamSchema), (c) => todoController.getById(c));
  app.put("/todos/:id", vValidator("param", IdParamSchema), vValidator("json", UpdateTodoSchema), (c) =>
    todoController.update(c),
  );
  app.delete("/todos/:id", vValidator("param", IdParamSchema), (c) => todoController.delete(c));
  app.get("/todos/:id/work-time", vValidator("param", IdParamSchema), (c) => todoController.getWorkTime(c));

  // TodoActivity routes
  app.post(
    "/todos/:id/activities",
    vValidator("param", IdParamSchema),
    vValidator("json", CreateTodoActivitySchema),
    (c) => todoActivityController.create(c),
  );
  app.get("/todos/:id/activities", vValidator("param", IdParamSchema), (c) => todoActivityController.getList(c));
  app.delete("/todos/:id/activities/:activityId", vValidator("param", TodoActivityIdParamSchema), (c) =>
    todoActivityController.delete(c),
  );

  return app;
}
