import { vValidator } from "@hono/valibot-validator";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { array, enum_, object, string } from "valibot";
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
import { prisma } from "../../infrastructure/db";
import { PrismaTagRepository } from "../../infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import { validate } from "../middlewares/validate";
import { IdParamSchema } from "../schemas/common-schemas";
import { TagSchema } from "../schemas/tag-schemas";
import { TodoSchema } from "../schemas/todo-schemas";
import { convertToResponseSchema } from "../utils/schema-converter";

const BulkTagOperationSchema = object({
  tagIds: array(string()),
  todoIds: array(string()),
});

const MultipleTagQuerySchema = object({
  tagIds: array(string()),
  mode: enum_({ all: "all", any: "any" }),
});

export function setupTagRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  tagRepository: TagRepository,
  todoRepository: TodoRepository,
): void {
  const bulkAssignTagUseCase = new BulkAssignTagUseCase(tagRepository, todoRepository);
  const bulkRemoveTagUseCase = new BulkRemoveTagUseCase(tagRepository, todoRepository);
  const getTagsForTodoUseCase = new GetTagsForTodoUseCase(tagRepository, todoRepository);
  const getTodosByTagUseCase = new GetTodosByTagUseCase(tagRepository, todoRepository);
  const getTodosByMultipleTagsUseCase = new GetTodosByMultipleTagsUseCase(tagRepository, todoRepository);

  // Get all tags
  app.get("/tags", async (c) => {
    const useCase = new GetAllTagsUseCase(tagRepository);
    const tags = await useCase.execute();
    const response = await Promise.all(tags.map((tag) => convertToResponseSchema(tag, TagSchema)));
    return c.json(response);
  });

  // Get tag usage statistics
  app.get("/tags/stats", async (c) => {
    const useCase = new GetTagStatisticsUseCase(tagRepository);
    const statistics = await useCase.execute();
    return c.json(statistics);
  });

  // Get todos by multiple tags
  app.get("/todos/by-tags", validate("query", MultipleTagQuerySchema), async (c) => {
    const query = c.req.valid("query") as {
      tagIds: string[];
      mode: "all" | "any";
    };
    const todos = await getTodosByMultipleTagsUseCase.execute({
      tagIds: query.tagIds,
      mode: query.mode,
    });
    const response = await Promise.all(todos.map((todo) => convertToResponseSchema(todo, TodoSchema)));
    return c.json(response);
  });

  // Bulk assign tags to todos
  app.post("/bulk-assign", validate("json", BulkTagOperationSchema), async (c) => {
    const data = c.req.valid("json") as {
      tagIds: string[];
      todoIds: string[];
    };
    await bulkAssignTagUseCase.execute({
      tagIds: data.tagIds,
      todoIds: data.todoIds,
    });
    c.status(204);
    return c.body(null);
  });

  // Bulk remove tags from todos
  app.post("/bulk-remove", validate("json", BulkTagOperationSchema), async (c) => {
    const data = c.req.valid("json") as {
      tagIds: string[];
      todoIds: string[];
    };
    await bulkRemoveTagUseCase.execute({
      tagIds: data.tagIds,
      todoIds: data.todoIds,
    });
    c.status(204);
    return c.body(null);
  });
}
