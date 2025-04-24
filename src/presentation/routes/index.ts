import type { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import { parse } from "valibot";
import { BulkAssignTagUseCase, BulkRemoveTagUseCase } from "../../application/use-cases/tag/bulk-tag-operations";
import { CreateTagUseCase } from "../../application/use-cases/tag/create-tag";
import { DeleteTagUseCase } from "../../application/use-cases/tag/delete-tag";
import { GetAllTagsUseCase, GetTagByIdUseCase } from "../../application/use-cases/tag/get-tag";
import { GetTagStatisticsUseCase } from "../../application/use-cases/tag/get-tag-statistics";
import { GetTodosByMultipleTagsUseCase } from "../../application/use-cases/tag/get-todos-by-multiple-tags";
import { GetTodosByTagUseCase } from "../../application/use-cases/tag/todo-tag-operations";
import { UpdateTagUseCase } from "../../application/use-cases/tag/update-tag";
import type { CreateTodoActivityUseCase } from "../../application/use-cases/todo-activity/create-todo-activity";
import type { DeleteTodoActivityUseCase } from "../../application/use-cases/todo-activity/delete-todo-activity";
import type { GetTodoActivityListUseCase } from "../../application/use-cases/todo-activity/get-todo-activity-list";
import type { CreateTodoUseCase } from "../../application/use-cases/todo/create-todo";
import type { DeleteTodoUseCase } from "../../application/use-cases/todo/delete-todo";
import type { GetTodoUseCase } from "../../application/use-cases/todo/get-todo";
import type { GetTodoListUseCase } from "../../application/use-cases/todo/get-todo-list";
import type { GetTodoWorkTimeUseCase } from "../../application/use-cases/todo/get-todo-work-time";
import type { UpdateTodoUseCase } from "../../application/use-cases/todo/update-todo";
import type { Tag } from "../../domain/entities/tag";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { PrismaClient } from "../../generated/prisma";
import { PrismaTagRepository } from "../../infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import { TodoTagController } from "../controllers/todo-tag-controller";
import {
  BulkTagOperationSchema,
  CreateTagSchema,
  MultipleTagQuerySchema,
  TagIdParamSchema,
  type TagResponse,
  TagSchema,
  UpdateTagSchema,
} from "../schemas/tag-schemas";
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

  // Todo-Tag relationship routes
  const todoTagController = new TodoTagController(prisma);
  app.route("/todos", todoTagController.getApp());

  // Tag routes - 直接index.tsに実装
  // リポジトリの作成
  const tagRepository = new PrismaTagRepository(prisma);
  const todoRepository = new PrismaTodoRepository(prisma);

  // Helper function to map Tag to TagResponse
  const mapTagToResponse = (tag: Tag): TagResponse => {
    const response: TagResponse = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };

    return parse(TagSchema, response);
  };

  // Create a new tag
  app.post("/tags", vValidator("json", CreateTagSchema), async (c) => {
    const input = c.req.valid("json");
    const useCase = new CreateTagUseCase(tagRepository);
    const tag = await useCase.execute(input);
    return c.json(mapTagToResponse(tag), 201);
  });

  // Get all tags
  app.get("/tags", async (c) => {
    const useCase = new GetAllTagsUseCase(tagRepository);
    const tags = await useCase.execute();
    return c.json(tags.map((tag) => mapTagToResponse(tag)));
  });

  // Get tag usage statistics
  app.get("/tags/stats", async (c) => {
    const useCase = new GetTagStatisticsUseCase(tagRepository);
    const statistics = await useCase.execute();
    return c.json(statistics);
  });

  // Get todos by multiple tags
  app.get("/tags/by-tags", async (c) => {
    try {
      const queryParams = {
        tagIds: c.req.query("tagIds") || "",
        mode: c.req.query("mode") || "all",
      };

      const validated = parse(MultipleTagQuerySchema, queryParams);
      const useCase = new GetTodosByMultipleTagsUseCase(tagRepository, todoRepository);

      const todos = await useCase.execute({
        tagIds: validated.tagIds,
        mode: validated.mode,
      });

      return c.json(
        todos.map((todo) => ({
          id: todo.id,
          title: todo.title,
          description: todo.description,
          status: todo.status,
          workState: todo.workState,
          totalWorkTime: todo.totalWorkTime,
          lastStateChangeAt: todo.lastStateChangeAt.toISOString(),
          createdAt: todo.createdAt.toISOString(),
          updatedAt: todo.updatedAt.toISOString(),
        })),
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return c.json({ message: error.message }, 404);
      }
      throw error;
    }
  });

  // Get a specific tag
  app.get("/tags/:id", async (c) => {
    const id = c.req.param("id");
    const useCase = new GetTagByIdUseCase(tagRepository);
    const tag = await useCase.execute({ id });

    if (!tag) {
      return c.json({ message: `Tag with ID '${id}' not found` }, 404);
    }

    return c.json(mapTagToResponse(tag));
  });

  // Update a tag
  app.put("/tags/:id", vValidator("json", UpdateTagSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    const useCase = new UpdateTagUseCase(tagRepository);

    try {
      const tag = await useCase.execute({ id, ...data });
      return c.json(mapTagToResponse(tag));
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return c.json({ message: error.message }, 404);
      }
      throw error;
    }
  });

  // Delete a tag
  app.delete("/tags/:id", async (c) => {
    const id = c.req.param("id");
    const useCase = new DeleteTagUseCase(tagRepository);

    try {
      await useCase.execute({ id });
      return c.status(204);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return c.json({ message: error.message }, 404);
      }
      throw error;
    }
  });

  // Get todos by tag
  app.get("/tags/:id/todos", async (c) => {
    const tagId = c.req.param("id");
    const useCase = new GetTodosByTagUseCase(tagRepository, todoRepository);

    try {
      const todos = await useCase.execute({ tagId });
      return c.json(
        todos.map((todo) => ({
          id: todo.id,
          title: todo.title,
          description: todo.description,
          status: todo.status,
          workState: todo.workState,
          totalWorkTime: todo.totalWorkTime,
          lastStateChangeAt: todo.lastStateChangeAt.toISOString(),
          createdAt: todo.createdAt.toISOString(),
          updatedAt: todo.updatedAt.toISOString(),
        })),
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return c.json({ message: error.message }, 404);
      }
      throw error;
    }
  });

  // Bulk assign a tag to multiple todos
  app.post("/tags/:id/bulk-assign", vValidator("json", BulkTagOperationSchema), async (c) => {
    const tagId = c.req.param("id");
    const data = c.req.valid("json");
    const useCase = new BulkAssignTagUseCase(tagRepository, todoRepository);

    try {
      const result = await useCase.execute({
        tagId,
        todoIds: data.todoIds,
      });

      return c.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return c.json({ message: error.message }, 404);
      }
      throw error;
    }
  });

  // Bulk remove a tag from multiple todos
  app.delete("/tags/:id/bulk-remove", vValidator("json", BulkTagOperationSchema), async (c) => {
    const tagId = c.req.param("id");
    const data = c.req.valid("json");
    const useCase = new BulkRemoveTagUseCase(tagRepository, todoRepository);

    try {
      const result = await useCase.execute({
        tagId,
        todoIds: data.todoIds,
      });

      return c.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return c.json({ message: error.message }, 404);
      }
      throw error;
    }
  });

  return app;
}
