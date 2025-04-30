import type { ConversionConfig } from "@valibot/to-json-schema";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import type * as v from "valibot";
import { BulkAssignTagUseCase, BulkRemoveTagUseCase } from "../../application/use-cases/tag/bulk-tag-operations";
import { TagNotFoundError } from "../../domain/errors/tag-errors";
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import { BulkTagOperationSchema } from "../schemas/tag-schemas";
import { ErrorResponseSchema, IdParamSchema } from "../schemas/todo-schemas";

const valibotConfig: ConversionConfig = {
  errorMode: "warn",
};

export function setupTagBulkRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  tagRepository: TagRepository,
  todoRepository: TodoRepository,
): Hono<E, S> {
  // Bulk assign tag to todos
  app.post(
    "/tags/:id/bulk-assign",
    describeRoute({
      tags: ["Tags", "Bulk Operations"],
      summary: "Bulk assign a tag to multiple todos",
      description: "Assign a tag to multiple todos in a single operation",
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
          description: "Bulk assign operation completed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  successCount: { type: "integer" },
                  failedCount: { type: "integer" },
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
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const { todoIds } = c.req.valid("json") as v.InferOutput<typeof BulkTagOperationSchema>;

      const useCase = new BulkAssignTagUseCase(tagRepository, todoRepository);

      try {
        const result = await useCase.execute({ tagIds: [id], todoIds });
        return c.json({
          successCount: result.successCount,
          failedCount: todoIds.length - result.successCount,
        });
      } catch (error) {
        if (error instanceof TagNotFoundError) {
          return c.json({ error: { message: error.message } }, 404);
        }
        throw error;
      }
    },
  );

  // Bulk remove tag from todos
  app.post(
    "/tags/:id/bulk-remove",
    describeRoute({
      tags: ["Tags", "Bulk Operations"],
      summary: "Bulk remove a tag from multiple todos",
      description: "Remove a tag from multiple todos in a single operation",
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
          description: "Bulk remove operation completed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  successCount: { type: "integer" },
                  failedCount: { type: "integer" },
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
      const { id } = c.req.valid("param") as v.InferOutput<typeof IdParamSchema>;
      const { todoIds } = c.req.valid("json") as v.InferOutput<typeof BulkTagOperationSchema>;

      const useCase = new BulkRemoveTagUseCase(tagRepository, todoRepository);

      try {
        const result = await useCase.execute({ tagIds: [id], todoIds });
        return c.json({
          successCount: result.successCount,
          failedCount: todoIds.length - result.successCount,
        });
      } catch (error) {
        if (error instanceof TagNotFoundError) {
          return c.json({ error: { message: error.message } }, 404);
        }
        throw error;
      }
    },
  );

  return app;
}
