import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { parse } from "valibot";
import { CreateTagUseCase } from "../../application/use-cases/tag/create-tag";
import { DeleteTagUseCase } from "../../application/use-cases/tag/delete-tag";
import { GetAllTagsUseCase, GetTagByIdUseCase } from "../../application/use-cases/tag/get-tag";
import { AssignTagToTodoUseCase, GetTagsForTodoUseCase } from "../../application/use-cases/tag/todo-tag";
import { GetTodosByTagUseCase, RemoveTagFromTodoUseCase } from "../../application/use-cases/tag/todo-tag-operations";
import { UpdateTagUseCase } from "../../application/use-cases/tag/update-tag";
import type { Tag } from "../../domain/entities/tag";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { PrismaClient } from "../../generated/prisma";
import { PrismaTagRepository } from "../../infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import {
  CreateTagSchema,
  TagIdParamSchema,
  type TagResponse,
  TagSchema,
  UpdateTagSchema,
} from "../schemas/tag-schemas";

/**
 * Tag controller for handling tag-related HTTP requests
 */
export class TagController {
  private app: Hono = new Hono();
  private prisma: PrismaClient;
  private tagRepository: TagRepository;
  private todoRepository: TodoRepository;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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
    // Create a new tag
    this.app.post("/", vValidator("json", CreateTagSchema), async (c) => {
      const input = c.req.valid("json");
      const useCase = new CreateTagUseCase(this.tagRepository);
      const tag = await useCase.execute(input);
      return c.json(this.mapTagToResponse(tag), 201);
    });

    // Get all tags
    this.app.get("/", async (c) => {
      const useCase = new GetAllTagsUseCase(this.tagRepository);
      const tags = await useCase.execute();
      return c.json(tags.map((tag) => this.mapTagToResponse(tag)));
    });

    // Get a specific tag
    this.app.get("/:id", async (c) => {
      const id = c.req.param("id");
      const useCase = new GetTagByIdUseCase(this.tagRepository);
      const tag = await useCase.execute({ id });

      if (!tag) {
        return c.json({ message: `Tag with ID '${id}' not found` }, 404);
      }

      return c.json(this.mapTagToResponse(tag));
    });

    // Update a tag
    this.app.put("/:id", vValidator("json", UpdateTagSchema), async (c) => {
      const id = c.req.param("id");
      const data = c.req.valid("json");
      const useCase = new UpdateTagUseCase(this.tagRepository);

      try {
        const tag = await useCase.execute({ id, ...data });
        return c.json(this.mapTagToResponse(tag));
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return c.json({ message: error.message }, 404);
        }
        throw error;
      }
    });

    // Delete a tag
    this.app.delete("/:id", async (c) => {
      const id = c.req.param("id");
      const useCase = new DeleteTagUseCase(this.tagRepository);

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

    // Assign a tag to a todo
    this.app.post("/todos/:todoId/tags", vValidator("json", TagIdParamSchema), async (c) => {
      const todoId = c.req.param("todoId");
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
    });

    // Get tags for a todo
    this.app.get("/todos/:todoId/tags", async (c) => {
      const todoId = c.req.param("todoId");
      const useCase = new GetTagsForTodoUseCase(this.tagRepository, this.todoRepository);

      try {
        const tags = await useCase.execute({ todoId });
        return c.json(tags.map((tag) => this.mapTagToResponse(tag)));
      } catch (error) {
        if (error instanceof Error && error.message.includes("not found")) {
          return c.json({ message: error.message }, 404);
        }
        throw error;
      }
    });

    // Remove a tag from a todo
    this.app.delete("/todos/:todoId/tags/:tagId", async (c) => {
      const todoId = c.req.param("todoId");
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
    });

    // Get todos by tag
    this.app.get("/todos/by-tag/:tagId", async (c) => {
      const tagId = c.req.param("tagId");
      const useCase = new GetTodosByTagUseCase(this.tagRepository, this.todoRepository);

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
  }

  /**
   * Map domain Tag to TagResponse
   */
  private mapTagToResponse(tag: Tag): TagResponse {
    const response: TagResponse = {
      id: tag.id,
      name: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    };

    return parse(TagSchema, response);
  }
}
