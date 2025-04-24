import type { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
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
import type { PrismaClient } from "../../generated/prisma";
import { TagController } from "../controllers/tag-controller";
import { TodoTagController } from "../controllers/todo-tag-controller";
import {
  CreateTodoActivitySchema,
  CreateTodoSchema,
  ErrorResponseSchema,
  IdParamSchema,
  TodoActivityIdParamSchema,
  TodoActivityListSchema,
  TodoActivitySchema,
  TodoListSchema,
  TodoSchema,
  UpdateTodoSchema,
  WorkTimeResponseSchema,
} from "../schemas/todo-schemas";

import type { ConversionConfig } from "@valibot/to-json-schema";
// Honoのより具体的な型定義をインポート
import type { Env, Schema } from "hono";

const valibotConfig: ConversionConfig = {
  errorMode: "warn",
};

/**
 * Setup API routes for the Todo application
 * @param app - Hono application instance
 * @returns Hono application instance with routes configured
 */
export function setupRoutes<E extends Env = Env>(
  app: Hono<E, Schema>,
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
  // PrismaClient for controllers
  prisma: PrismaClient,
): Hono<E, Schema> {
  // Todo routes
  app.post(
    "/todos",
    describeRoute({
      tags: ["Todos"],
      summary: "Create a new todo",
      description: "Create a new todo item with the provided data",
      request: {
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(CreateTodoSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Todo created successfully",
          content: {
            "application/json": {
              schema: resolver(TodoSchema, valibotConfig),
            },
          },
        },
        400: {
          description: "Invalid request data",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("json", CreateTodoSchema),
    async (c) => {
      const data = c.req.valid("json");
      const todo = await createTodoUseCase.execute(data);
      return c.json(todo, 201);
    },
  );

  app.get(
    "/todos",
    describeRoute({
      tags: ["Todos"],
      summary: "Get all todos",
      description: "Retrieve a list of all todo items",
      responses: {
        200: {
          description: "List of todos",
          content: {
            "application/json": {
              schema: resolver(TodoListSchema, valibotConfig),
            },
          },
        },
      },
    }),
    async (c) => {
      const todos = await getTodoListUseCase.execute();
      return c.json(todos);
    },
  );

  app.get(
    "/todos/:id",
    describeRoute({
      tags: ["Todos"],
      summary: "Get a specific todo",
      description: "Retrieve a todo item by its ID",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "Todo details",
          content: {
            "application/json": {
              schema: resolver(TodoSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
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
    },
  );

  app.put(
    "/todos/:id",
    describeRoute({
      tags: ["Todos"],
      summary: "Update a todo",
      description: "Update a todo item with the provided data",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(UpdateTodoSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Todo updated successfully",
          content: {
            "application/json": {
              schema: resolver(TodoSchema, valibotConfig),
            },
          },
        },
        400: {
          description: "Invalid request data",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    vValidator("json", UpdateTodoSchema),
    async (c) => {
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
    },
  );

  app.delete(
    "/todos/:id",
    describeRoute({
      tags: ["Todos"],
      summary: "Delete a todo",
      description: "Delete a todo item by its ID",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Todo deleted successfully",
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
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
    },
  );

  app.get(
    "/todos/:id/work-time",
    describeRoute({
      tags: ["Todos", "Work Time"],
      summary: "Get work time information",
      description: "Retrieve work time information for a todo item",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "Work time information",
          content: {
            "application/json": {
              schema: resolver(WorkTimeResponseSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
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
    },
  );

  // TodoActivity routes
  app.post(
    "/todos/:id/activities",
    describeRoute({
      tags: ["Todos", "Activities"],
      summary: "Create a new activity",
      description: "Create a new activity for a todo item",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(CreateTodoActivitySchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Activity created successfully",
          content: {
            "application/json": {
              schema: resolver(TodoActivitySchema, valibotConfig),
            },
          },
        },
        400: {
          description: "Invalid state transition or request data",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
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

  app.get(
    "/todos/:id/activities",
    describeRoute({
      tags: ["Todos", "Activities"],
      summary: "Get activities for a todo",
      description: "Retrieve a list of activities for a todo item",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "List of activities",
          content: {
            "application/json": {
              schema: resolver(TodoActivityListSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
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
    },
  );

  app.delete(
    "/todos/:id/activities/:activityId",
    describeRoute({
      tags: ["Todos", "Activities"],
      summary: "Delete an activity",
      description: "Delete an activity for a todo item",
      request: {
        params: resolver(TodoActivityIdParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Activity deleted successfully",
        },
        403: {
          description: "Unauthorized deletion",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Todo or activity not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", TodoActivityIdParamSchema),
    async (c) => {
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
    },
  );

  // Tag routes
  const tagController = new TagController(prisma);
  app.route("/tags", tagController.getApp());

  // Todo-Tag relationship routes
  const todoTagController = new TodoTagController(prisma);
  app.route("/todos", todoTagController.getApp());

  return app;
}
