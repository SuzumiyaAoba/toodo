import type { ConversionConfig } from "@valibot/to-json-schema";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import type * as v from "valibot";
import { parse } from "valibot";
import { BulkAssignTagUseCase, BulkRemoveTagUseCase } from "../../application/use-cases/tag/bulk-tag-operations";
import { CreateTagUseCase } from "../../application/use-cases/tag/create-tag";
import { DeleteTagUseCase } from "../../application/use-cases/tag/delete-tag";
import { GetAllTagsUseCase, GetTagByIdUseCase } from "../../application/use-cases/tag/get-tag";
import { GetTagStatisticsUseCase } from "../../application/use-cases/tag/get-tag-statistics";
import { GetTodosByMultipleTagsUseCase } from "../../application/use-cases/tag/get-todos-by-multiple-tags";
import { AssignTagToTodoUseCase, GetTagsForTodoUseCase } from "../../application/use-cases/tag/todo-tag";
import { GetTodosByTagUseCase, RemoveTagFromTodoUseCase } from "../../application/use-cases/tag/todo-tag-operations";
import { UpdateTagUseCase } from "../../application/use-cases/tag/update-tag";
import type { Tag } from "../../domain/entities/tag";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import {
  BulkTagOperationSchema,
  CreateTagSchema,
  MultipleTagQuerySchema,
  TagIdParamSchema,
  type TagResponse,
  TagSchema,
  UpdateTagSchema,
} from "../schemas/tag-schemas";
import { ErrorResponseSchema, IdParamSchema, TodoListSchema, TodoTagParamSchema } from "../schemas/todo-schemas";

/**
 * ConversionConfig for valibot to JSON schema
 */
const valibotConfig: ConversionConfig = {
  errorMode: "warn",
};

/**
 * Helper function to map Tag to TagResponse
 */
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

/**
 * Setup API routes for Tag management
 */
export function setupTagRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  tagRepository: TagRepository,
  todoRepository: TodoRepository,
): Hono<E, S> {
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
      const { tagId } = c.req.valid("json") as v.InferOutput<typeof TagIdParamSchema>;
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
        params: resolver(IdParamSchema, valibotConfig),
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
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const useCase = new GetTagByIdUseCase(tagRepository);

      try {
        const tag = await useCase.execute({ id });

        if (!tag) {
          return c.json({ message: `Tag with ID '${id}' not found` }, 404);
        }

        return c.json(mapTagToResponse(tag));
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return c.json({ message: error.message }, 404);
        }
        throw error;
      }
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
        params: resolver(IdParamSchema, valibotConfig),
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
    vValidator("param", IdParamSchema),
    vValidator("json", UpdateTagSchema),
    async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json") as v.InferOutput<typeof UpdateTagSchema>;
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
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Tag deleted successfully",
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
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
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
        params: resolver(IdParamSchema, valibotConfig),
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
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id: tagId } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
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
        params: resolver(IdParamSchema, valibotConfig),
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
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    vValidator("json", BulkTagOperationSchema),
    async (c) => {
      const { id: tagId } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const data = c.req.valid("json") as v.InferOutput<typeof BulkTagOperationSchema>;
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
        params: resolver(IdParamSchema, valibotConfig),
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
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    vValidator("json", BulkTagOperationSchema),
    async (c) => {
      const { id: tagId } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const data = c.req.valid("json") as v.InferOutput<typeof BulkTagOperationSchema>;
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

  // Create a new tag
  app.post(
    "/tags",
    describeRoute({
      tags: ["Tags"],
      summary: "Create a new tag",
      description: "Create a new tag with the provided information",
      request: {
        body: {
          required: true,
          content: {
            "application/json": {
              schema: resolver(CreateTagSchema, valibotConfig),
            },
          },
        },
      },
      responses: {
        201: {
          description: "Tag created successfully",
          content: {
            "application/json": {
              schema: resolver(TagSchema, valibotConfig),
            },
          },
        },
        400: {
          description: "Invalid tag data",
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
    vValidator("json", CreateTagSchema),
    async (c) => {
      const data = c.req.valid("json") as v.InferOutput<typeof CreateTagSchema>;
      const useCase = new CreateTagUseCase(tagRepository);

      try {
        const tag = await useCase.execute(data);
        return c.json(mapTagToResponse(tag), 201);
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ message: error.message }, 400);
        }
        throw error;
      }
    },
  );

  return app;
}
