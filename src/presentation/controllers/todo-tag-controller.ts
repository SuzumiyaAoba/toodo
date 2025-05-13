import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { AssignTagToTodoUseCase, GetTagsForTodoUseCase } from "../../application/use-cases/tag/todo-tag";
import { RemoveTagFromTodoUseCase } from "../../application/use-cases/tag/todo-tag-operations";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { PrismaClient } from "../../generated/prisma";
import { PrismaTagRepository } from "../../infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import { TagIdParamSchema, TagListSchema } from "../schemas/tag-schemas";
import { IdParamSchema, TodoTagParamSchema } from "../schemas/todo-schemas";

/**
 * Controller for managing todo-tag relationships
 */
export class TodoTagController {
  private app: Hono = new Hono();
  private tagRepository: TagRepository;
  private todoRepository: TodoRepository;

  constructor(prisma: PrismaClient) {
    this.tagRepository = new PrismaTagRepository(prisma);
    this.todoRepository = new PrismaTodoRepository(prisma);
    this.setupRoutes();
  }

  /**
   * Get Hono instance with configured routes
   */
  getApp(): Hono {
    return this.app;
  }

  /**
   * Setup routes
   */
  private setupRoutes(): void {
    // Get tags for a todo
    this.app.get(
      "/:id/tags",
      describeRoute({
        tags: ["Todos", "Tags"],
        summary: "Get tags for a todo",
        description: "Retrieve all tags associated with a specific todo",
        request: {
          params: IdParamSchema,
        },
        responses: {
          200: {
            description: "List of tags",
            content: {
              "application/json": {
                schema: TagListSchema,
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
        const useCase = new GetTagsForTodoUseCase(this.tagRepository, this.todoRepository);

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
    this.app.post(
      "/:id/tags",
      describeRoute({
        tags: ["Todos", "Tags"],
        summary: "Assign a tag to a todo",
        description: "Assign an existing tag to a todo",
        request: {
          params: IdParamSchema,
          body: {
            required: true,
            content: {
              "application/json": {
                schema: TagIdParamSchema,
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
        const useCase = new AssignTagToTodoUseCase(this.tagRepository, this.todoRepository);

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
    this.app.delete(
      "/:id/tags/:tagId",
      describeRoute({
        tags: ["Todos", "Tags"],
        summary: "Remove a tag from a todo",
        description: "Remove a tag association from a todo",
        request: {
          params: TodoTagParamSchema,
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
        const useCase = new RemoveTagFromTodoUseCase(this.tagRepository, this.todoRepository);

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
  }
}
