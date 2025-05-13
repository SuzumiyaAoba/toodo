import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import type { Env, Schema as HonoSchema } from "hono";
import { parse } from "valibot";
import { BulkAssignTagUseCase, BulkRemoveTagUseCase } from "../../application/use-cases/tag/bulk-tag-operations";
import { CreateTagUseCase } from "../../application/use-cases/tag/create-tag";
import { DeleteTagUseCase } from "../../application/use-cases/tag/delete-tag";
import { GetAllTagsUseCase, GetTagByIdUseCase } from "../../application/use-cases/tag/get-tag";
import { GetTagStatisticsUseCase } from "../../application/use-cases/tag/get-tag-statistics";
import { GetTodosByMultipleTagsUseCase } from "../../application/use-cases/tag/get-todos-by-multiple-tags";
import { GetTodosByTagUseCase } from "../../application/use-cases/tag/todo-tag-operations";
import { UpdateTagUseCase } from "../../application/use-cases/tag/update-tag";
import type { Tag } from "../../domain/entities/tag";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { PrismaClient } from "../../generated/prisma";
import { PrismaTagRepository } from "../../infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import {
  BulkTagOperationSchema,
  CreateTagSchema,
  MultipleTagQuerySchema,
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
  getApp(): Hono<Env, HonoSchema> {
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

    // Get tag usage statistics
    this.app.get("/stats", async (c) => {
      const useCase = new GetTagStatisticsUseCase(this.tagRepository);
      const statistics = await useCase.execute();

      return c.json(statistics);
    });

    // Get todos by multiple tags
    this.app.get("/by-tags", async (c) => {
      try {
        const queryParams = {
          tagIds: c.req.query("tagIds") || "",
          mode: c.req.query("mode") || "all",
        };

        const validated = parse(MultipleTagQuerySchema, queryParams);
        const useCase = new GetTodosByMultipleTagsUseCase(this.tagRepository, this.todoRepository);

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

    // Get todos by tag
    this.app.get("/:id/todos", async (c) => {
      const tagId = c.req.param("id");
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

    // Bulk assign a tag to multiple todos
    this.app.post("/:id/bulk-assign", vValidator("json", BulkTagOperationSchema), async (c) => {
      const tagId = c.req.param("id");
      const data = c.req.valid("json");
      const useCase = new BulkAssignTagUseCase(this.tagRepository, this.todoRepository);

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
    this.app.delete("/:id/bulk-remove", vValidator("json", BulkTagOperationSchema), async (c) => {
      const tagId = c.req.param("id");
      const data = c.req.valid("json");
      const useCase = new BulkRemoveTagUseCase(this.tagRepository, this.todoRepository);

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
