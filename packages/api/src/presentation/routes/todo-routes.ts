import type { ConversionConfig } from "@valibot/to-json-schema";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import type { ErrorHandler } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import { HTTPException } from "hono/http-exception";
import type * as v from "valibot";
import type { CreateTodoActivityUseCase } from "../../application/use-cases/todo-activity/create-todo-activity";
import type { DeleteTodoActivityUseCase } from "../../application/use-cases/todo-activity/delete-todo-activity";
import type { GetTodoActivityListUseCase } from "../../application/use-cases/todo-activity/get-todo-activity-list";
import type { CreateTodoUseCase } from "../../application/use-cases/todo/create-todo";
import type { DeleteTodoUseCase } from "../../application/use-cases/todo/delete-todo";
import type { GetTodoUseCase } from "../../application/use-cases/todo/get-todo";
import type { GetTodoListUseCase } from "../../application/use-cases/todo/get-todo-list";
import type { GetTodoWorkTimeUseCase } from "../../application/use-cases/todo/get-todo-work-time";
import type { UpdateTodoUseCase } from "../../application/use-cases/todo/update-todo";
import type { PriorityLevel } from "../../domain/entities/todo";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import { errorHandler } from "../middlewares/error-handler";
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

/**
 * ConversionConfig for valibot to JSON schema
 */
const valibotConfig: ConversionConfig = {
  errorMode: "warn",
};

/**
 * Setup API routes for Todo and TodoActivity
 */
export function setupTodoRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
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
): Hono<E, S> {
  // Error handling middleware
  app.onError(errorHandler);

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
      const data = c.req.valid("json") as v.InferOutput<typeof CreateTodoSchema>;

      const todoData = {
        ...data,
        priority: data.priority ? (data.priority as PriorityLevel) : undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      };

      const todo = await createTodoUseCase.execute(todoData);
      return c.json(todo, 201);
    },
  );

  app.get(
    "/todos",
    describeRoute({
      tags: ["Todos"],
      summary: "Get all todos",
      description: "Retrieve a list of all todo items with optional filtering",
      request: {
        query: {
          schema: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["pending", "in_progress", "completed"],
                description: "Filter todos by status",
              },
              priority: {
                type: "string",
                enum: ["low", "medium", "high"],
                description: "Filter todos by priority",
              },
            },
          },
        },
      },
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
      const status = c.req.query("status");
      const priority = c.req.query("priority");

      const todos = await getTodoListUseCase.execute();

      let filteredTodos = todos;

      if (status) {
        filteredTodos = filteredTodos.filter((todo) => todo.status === status);
      }

      if (priority) {
        filteredTodos = filteredTodos.filter((todo) => todo.priority === priority);
      }

      return c.json(filteredTodos);
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
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const todo = await getTodoUseCase.execute(id);
      return c.json(todo);
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
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const data = c.req.valid("json") as v.InferOutput<typeof UpdateTodoSchema>;

      const todo = await updateTodoUseCase.execute(id, data);
      return c.json(todo);
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
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      await deleteTodoUseCase.execute(id);
      return c.body(null, 204);
    },
  );

  app.get(
    "/todos/:id/work-time",
    describeRoute({
      tags: ["Todos"],
      summary: "Get todo work time",
      description: "Get the total work time for a todo item",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "Work time details",
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
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const workTime = await getTodoWorkTimeUseCase.execute(id);
      return c.json(workTime);
    },
  );

  // TodoActivity routes
  app.post(
    "/todos/:id/activities",
    describeRoute({
      tags: ["TodoActivities"],
      summary: "Create a new todo activity",
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
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const data = c.req.valid("json") as v.InferOutput<typeof CreateTodoActivitySchema>;

      const activity = await createTodoActivityUseCase.execute(id, data);
      return c.json(activity, 201);
    },
  );

  app.get(
    "/todos/:id/activities",
    describeRoute({
      tags: ["TodoActivities"],
      summary: "Get todo activities",
      description: "Get all activities for a todo item",
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
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const activities = await getTodoActivityListUseCase.execute(id);
      return c.json(activities);
    },
  );

  app.delete(
    "/todos/:todoId/activities/:activityId",
    describeRoute({
      tags: ["TodoActivities"],
      summary: "Delete a todo activity",
      description: "Delete an activity from a todo item",
      request: {
        params: resolver(TodoActivityIdParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Activity deleted successfully",
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
      const params = c.req.valid("param") as {
        todoId: string;
        activityId: string;
      };
      await deleteTodoActivityUseCase.execute(params.todoId, params.activityId);
      return c.body(null, 204);
    },
  );

  return app;
}
