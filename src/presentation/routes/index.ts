import type { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import { parse } from "valibot";
import { AddTodoToProject } from "../../application/use-cases/project/add-todo-to-project";
import { CreateProject } from "../../application/use-cases/project/create-project";
import { DeleteProject } from "../../application/use-cases/project/delete-project";
import { GetAllProjects } from "../../application/use-cases/project/get-all-projects";
import { GetProject } from "../../application/use-cases/project/get-project";
import { GetTodosByProject } from "../../application/use-cases/project/get-todos-by-project";
import { RemoveTodoFromProject } from "../../application/use-cases/project/remove-todo-from-project";
import { UpdateProject } from "../../application/use-cases/project/update-project";
import { BulkAssignTagUseCase, BulkRemoveTagUseCase } from "../../application/use-cases/tag/bulk-tag-operations";
import { CreateTagUseCase } from "../../application/use-cases/tag/create-tag";
import { DeleteTagUseCase } from "../../application/use-cases/tag/delete-tag";
import { GetAllTagsUseCase, GetTagByIdUseCase } from "../../application/use-cases/tag/get-tag";
import { GetTagStatisticsUseCase } from "../../application/use-cases/tag/get-tag-statistics";
import { GetTodosByMultipleTagsUseCase } from "../../application/use-cases/tag/get-todos-by-multiple-tags";
import { AssignTagToTodoUseCase, GetTagsForTodoUseCase } from "../../application/use-cases/tag/todo-tag";
import { GetTodosByTagUseCase, RemoveTagFromTodoUseCase } from "../../application/use-cases/tag/todo-tag-operations";
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
import { ProjectNameExistsError, ProjectNotFoundError } from "../../domain/errors/project-errors";
import {
  InvalidStateTransitionError,
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../domain/errors/todo-errors";
import type { ProjectRepository } from "../../domain/repositories/project-repository";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { PrismaClient } from "../../generated/prisma";
import { PrismaProjectRepository } from "../../infrastructure/repositories/prisma-project-repository";
import { PrismaTagRepository } from "../../infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import {
  type AddTodoToProjectRequest,
  type CreateProjectRequest,
  ProjectSchema,
  type UpdateProjectRequest,
  UpdateProjectSchema,
  addTodoToProjectRequestSchema,
  createProjectRequestSchema,
  updateProjectRequestSchema,
} from "../schemas/project-schemas";
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
  TodoTagParamSchema,
  UpdateTodoSchema,
  WorkTimeResponseSchema,
} from "../schemas/todo-schemas";

import type { ConversionConfig } from "@valibot/to-json-schema";
// Honoのより具体的な型定義をインポート
import type { Context, Env, Schema } from "hono";

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

  // Todo-Tag relationship routes - 直接index.tsに実装
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

  // Get all tags
  app.get(
    "/tags",
    describeRoute({
      tags: ["Tags"],
      summary: "Get all tags",
      description: "Retrieve a list of all tags in the system",
      responses: {
        200: {
          description: "List of tags",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: resolver(TagSchema, valibotConfig),
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const useCase = new GetAllTagsUseCase(tagRepository);
      const tags = await useCase.execute();
      return c.json(tags.map((tag) => mapTagToResponse(tag)));
    },
  );

  // Get tag usage statistics
  app.get(
    "/tags/stats",
    describeRoute({
      tags: ["Tags", "Statistics"],
      summary: "Get tag usage statistics",
      description: "Retrieve statistics about tag usage including count of todos per tag",
      responses: {
        200: {
          description: "Tag statistics",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    name: { type: "string" },
                    color: { type: "string", nullable: true },
                    usageCount: { type: "number" },
                    pendingTodoCount: { type: "number" },
                    completedTodoCount: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const useCase = new GetTagStatisticsUseCase(tagRepository);
      const statistics = await useCase.execute();
      return c.json(statistics);
    },
  );

  // Get todos by multiple tags
  app.get(
    "/todos/by-tags",
    describeRoute({
      tags: ["Todos", "Tags"],
      summary: "Get todos by multiple tags",
      description: "Retrieve todos that have all or any of the specified tags",
      request: {
        query: {
          schema: {
            type: "object",
            properties: {
              tagIds: {
                type: "string",
                description: "Comma-separated list of tag IDs",
              },
              mode: {
                type: "string",
                enum: ["all", "any"],
                default: "all",
                description:
                  "Filter mode: 'all' (todos with all specified tags) or 'any' (todos with any of the specified tags)",
              },
            },
            required: ["tagIds"],
          },
        },
      },
      responses: {
        200: {
          description: "List of todos with the specified tags",
          content: {
            "application/json": {
              schema: resolver(TodoListSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Tag not found",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    async (c) => {
      try {
        const queryParams = {
          tagIds: c.req.query("tagIds") || "",
          mode: c.req.query("mode") || "all",
        };

        const parsedParams = parse(MultipleTagQuerySchema, queryParams);
        const useCase = new GetTodosByMultipleTagsUseCase(tagRepository, todoRepository);

        const todos = await useCase.execute({
          tagIds: parsedParams.tagIds,
          mode: parsedParams.mode,
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
    },
  );

  // Get tags for a todo
  app.get(
    "/todos/:id/tags",
    describeRoute({
      tags: ["Todos", "Tags"],
      summary: "Get tags for a todo",
      description: "Retrieve all tags associated with a specific todo",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "List of tags",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: resolver(TagSchema, valibotConfig),
              },
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const todoId = c.req.param("id");
      const useCase = new GetTagsForTodoUseCase(tagRepository, todoRepository);

      try {
        const tags = await useCase.execute({ todoId });
        return c.json(tags);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return c.json({ message: error.message }, 404);
        }
        throw error;
      }
    },
  );

  // Assign a tag to a todo
  app.get(
    "/todos/:id/tags",
    describeRoute({
      tags: ["Todos", "Tags"],
      summary: "Get tags for a todo",
      description: "Retrieve all tags associated with a specific todo",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "List of tags",
          content: {
            "application/json": {
              schema: {
                type: "array",
                items: resolver(TagSchema, valibotConfig),
              },
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const todoId = c.req.param("id");
      const useCase = new GetTagsForTodoUseCase(tagRepository, todoRepository);

      try {
        const tags = await useCase.execute({ todoId });
        return c.json(tags);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return c.json({ message: error.message }, 404);
        }
        throw error;
      }
    },
  );

  // Assign a tag to a todo
  app.post(
    "/todos/:id/tags",
    describeRoute({
      tags: ["Todos", "Tags"],
      summary: "Assign a tag to a todo",
      description: "Assign an existing tag to a specific todo",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(TagIdParamSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Tag assigned successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
        400: {
          description: "Tag already assigned to todo",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
        404: {
          description: "Todo or tag not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    vValidator("json", TagIdParamSchema),
    async (c) => {
      const todoId = c.req.param("id");
      const { tagId } = c.req.valid("json");
      const useCase = new AssignTagToTodoUseCase(tagRepository, todoRepository);

      try {
        await useCase.execute({ todoId, tagId });
        return c.json({ message: "Tag assigned successfully" }, 201);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("not found")) {
            return c.json({ message: error.message }, 404);
          }
          if (error.message.includes("already assigned")) {
            return c.json({ message: error.message }, 400);
          }
        }
        throw error;
      }
    },
  );

  // Remove a tag from a todo
  app.delete(
    "/todos/:id/tags/:tagId",
    describeRoute({
      tags: ["Todos", "Tags"],
      summary: "Remove a tag from a todo",
      description: "Remove a tag association from a todo",
      request: {
        params: resolver(TodoTagParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Tag removed successfully",
        },
        400: {
          description: "Tag not assigned to todo",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
        404: {
          description: "Todo or tag not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", TodoTagParamSchema),
    async (c) => {
      const todoId = c.req.param("id");
      const tagId = c.req.param("tagId");
      const useCase = new RemoveTagFromTodoUseCase(tagRepository, todoRepository);

      try {
        await useCase.execute({ todoId, tagId });
        return c.status(204);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes("not found")) {
            return c.json({ message: error.message }, 404);
          }
          if (error.message.includes("not assigned")) {
            return c.json({ message: error.message }, 400);
          }
        }
        throw error;
      }
    },
  );

  // Get a specific tag
  app.get(
    "/tags/:id",
    describeRoute({
      tags: ["Tags"],
      summary: "Get a specific tag",
      description: "Retrieve a tag by its ID",
      request: {
        params: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
            },
            required: ["id"],
          },
        },
      },
      responses: {
        200: {
          description: "Tag details",
          content: {
            "application/json": {
              schema: resolver(TagSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Tag not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id");
      const useCase = new GetTagByIdUseCase(tagRepository);
      const tag = await useCase.execute({ id });

      if (!tag) {
        return c.json({ message: `Tag with ID '${id}' not found` }, 404);
      }

      return c.json(mapTagToResponse(tag));
    },
  );

  // Update a tag
  app.put(
    "/tags/:id",
    describeRoute({
      tags: ["Tags"],
      summary: "Update a tag",
      description: "Update an existing tag with new information",
      request: {
        params: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
            },
            required: ["id"],
          },
        },
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(UpdateTagSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Tag updated successfully",
          content: {
            "application/json": {
              schema: resolver(TagSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Tag not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("json", UpdateTagSchema),
    async (c) => {
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
    },
  );

  // Delete a tag
  app.delete(
    "/tags/:id",
    describeRoute({
      tags: ["Tags"],
      summary: "Delete a tag",
      description: "Delete a tag by its ID",
      request: {
        params: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
            },
            required: ["id"],
          },
        },
      },
      responses: {
        204: {
          description: "Tag deleted successfully",
        },
        404: {
          description: "Tag not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const id = c.req.param("id");
      const useCase = new DeleteTagUseCase(tagRepository);

      try {
        await useCase.execute({ id });
        return c.status(204);
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      }
    },
  );

  // Get todos by tag
  app.get(
    "/tags/:id/todos",
    describeRoute({
      tags: ["Tags", "Todos"],
      summary: "Get todos by tag",
      description: "Retrieve all todo items that have a specific tag",
      request: {
        params: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "The tag ID" },
            },
            required: ["id"],
          },
        },
      },
      responses: {
        200: {
          description: "List of todos with the specified tag",
          content: {
            "application/json": {
              schema: resolver(TodoListSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Tag not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    async (c) => {
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
    },
  );

  // Bulk assign a tag to multiple todos
  app.post(
    "/tags/:id/bulk-assign",
    describeRoute({
      tags: ["Tags", "Bulk Operations"],
      summary: "Bulk assign a tag to todos",
      description: "Assign a tag to multiple todo items at once",
      request: {
        params: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "The tag ID" },
            },
            required: ["id"],
          },
        },
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(BulkTagOperationSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Result of bulk assignment operation",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  successCount: { type: "number", description: "Number of todos that were successfully tagged" },
                  failedCount: { type: "number", description: "Number of todos that failed to be tagged" },
                },
              },
            },
          },
        },
        404: {
          description: "Tag not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("json", BulkTagOperationSchema),
    async (c) => {
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
    },
  );

  // Bulk remove a tag from multiple todos
  app.delete(
    "/tags/:id/bulk-remove",
    describeRoute({
      tags: ["Tags", "Bulk Operations"],
      summary: "Bulk remove a tag from todos",
      description: "Remove a tag from multiple todo items at once",
      request: {
        params: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid", description: "The tag ID" },
            },
            required: ["id"],
          },
        },
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(BulkTagOperationSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Result of bulk removal operation",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  successCount: {
                    type: "number",
                    description: "Number of todos the tag was successfully removed from",
                  },
                  failedCount: { type: "number", description: "Number of todos that failed tag removal" },
                },
              },
            },
          },
        },
        404: {
          description: "Tag not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("json", BulkTagOperationSchema),
    async (c) => {
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
    },
  );

  // Project routes
  const projectRepository = new PrismaProjectRepository(prisma);

  // Projects API endpoints
  app.post(
    "/projects",
    describeRoute({
      tags: ["Projects"],
      summary: "Create a new project",
      description: "Create a new project with the provided data",
      request: {
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(createProjectRequestSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Project created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  project: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      name: { type: "string" },
                      description: { type: "string", nullable: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        409: {
          description: "Project name already exists",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("json", createProjectRequestSchema),
    async (c) => {
      const input = c.req.valid("json");
      const createProject = new CreateProject(projectRepository);

      try {
        const project = await createProject.execute(input);
        return c.json({ project }, 201);
      } catch (error) {
        if (error instanceof ProjectNameExistsError) {
          return c.json({ error: error.message }, 409);
        }
        throw error;
      }
    },
  );

  app.get(
    "/projects",
    describeRoute({
      tags: ["Projects"],
      summary: "Get all projects",
      description: "Retrieve a list of all projects",
      responses: {
        200: {
          description: "List of projects",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const getAllProjects = new GetAllProjects(projectRepository);
      const projects = await getAllProjects.execute();
      return c.json({ projects });
    },
  );

  app.get(
    "/projects/:id",
    describeRoute({
      tags: ["Projects"],
      summary: "Get a specific project",
      description: "Retrieve a project by its ID",
      request: {
        params: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
            },
            required: ["id"],
          },
        },
      },
      responses: {
        200: {
          description: "Project details",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  project: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      name: { type: "string" },
                      description: { type: "string", nullable: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Project not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const projectId = c.req.param("id");
      const getProject = new GetProject(projectRepository);

      try {
        const project = await getProject.execute(projectId);
        return c.json({ project });
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      }
    },
  );

  app.put(
    "/projects/:id",
    describeRoute({
      tags: ["Projects"],
      summary: "Update a project",
      description: "Update a project with the provided data",
      request: {
        params: {
          schema: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
            },
            required: ["id"],
          },
        },
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(updateProjectRequestSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        200: {
          description: "Project updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  project: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      name: { type: "string" },
                      description: { type: "string", nullable: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Project not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
        409: {
          description: "Project name already exists",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("json", updateProjectRequestSchema),
    async (c) => {
      const projectId = c.req.param("id");
      const input = c.req.valid("json");
      const updateProject = new UpdateProject(projectRepository);

      try {
        const project = await updateProject.execute({
          id: projectId,
          ...input,
        });
        return c.json({ project });
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (error instanceof ProjectNameExistsError) {
          return c.json({ error: error.message }, 409);
        }
        throw error;
      }
    },
  );

  app.delete(
    "/projects/:id",
    describeRoute({
      tags: ["Projects"],
      summary: "Delete a project",
      description: "Delete a project by its ID",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Project deleted successfully",
        },
        404: {
          description: "Project not found",
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
      const useCase = new DeleteProject(projectRepository);

      try {
        await useCase.execute(id);
        c.status(204);
        return c.body(null);
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      }
    },
  );

  // Get todos by project
  app.get(
    "/projects/:id/todos",
    describeRoute({
      tags: ["Projects", "Todos"],
      summary: "Get todos by project",
      description: "Retrieve all todo items associated with a specific project",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "Project with associated todos",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  project: {
                    type: "object",
                    properties: {
                      id: { type: "string", format: "uuid" },
                      name: { type: "string" },
                      description: { type: "string", nullable: true },
                      createdAt: { type: "string", format: "date-time" },
                      updatedAt: { type: "string", format: "date-time" },
                    },
                  },
                  todos: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string", format: "uuid" },
                        title: { type: "string" },
                        description: { type: "string", nullable: true },
                        status: { type: "string", enum: ["pending", "in_progress", "completed"] },
                        workState: { type: "string", enum: ["idle", "active", "paused", "completed"] },
                        totalWorkTime: { type: "number" },
                        lastStateChangeAt: { type: "string", format: "date-time" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                        priority: { type: "string", enum: ["low", "medium", "high"] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: "Project not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const useCase = new GetTodosByProject(projectRepository, todoRepository);

      try {
        const result = await useCase.execute(id);
        return c.json({
          project: result.project,
          todos: result.todos,
        });
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      }
    },
  );

  // Add a todo to a project
  app.post(
    "/projects/:id/todos",
    describeRoute({
      tags: ["Projects", "Todos"],
      summary: "Add a todo to a project",
      description: "Associate an existing todo with a project",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(addTodoToProjectRequestSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Todo added to project successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean" },
                },
              },
            },
          },
        },
        404: {
          description: "Project or todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    vValidator("json", addTodoToProjectRequestSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const { todoId } = c.req.valid("json");
      const useCase = new AddTodoToProject(projectRepository, todoRepository);

      try {
        await useCase.execute({
          projectId: id,
          todoId,
        });
        return c.json({ success: true }, 201);
      } catch (error) {
        if (error instanceof ProjectNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (error instanceof TodoNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      }
    },
  );

  // Remove a todo from a project
  app.delete(
    "/projects/:id/todos/:todoId",
    describeRoute({
      tags: ["Projects", "Todos"],
      summary: "Remove a todo from a project",
      description: "Remove the association between a todo and a project",
      request: {
        params: resolver(TodoTagParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Todo removed from project successfully",
        },
        404: {
          description: "Project or todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", TodoTagParamSchema),
    async (c) => {
      const { id, tagId: todoId } = c.req.valid("param");
      const useCase = new RemoveTodoFromProject(projectRepository, todoRepository);

      try {
        await useCase.execute({ projectId: id, todoId });
        c.status(204);
        return c.body(null);
      } catch (error) {
        if (error instanceof ProjectNotFoundError || error instanceof TodoNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      }
    },
  );

  return app;
}
