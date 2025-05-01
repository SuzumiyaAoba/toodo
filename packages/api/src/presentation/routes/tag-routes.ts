import { Hono } from "hono";
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
import type { TagRepository } from "../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import { validate } from "../middlewares/validate";
import { TagSchema } from "../schemas/tag-schemas";
import { CreateTagSchema } from "../schemas/tag-schemas";
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

export const tagRoutes = new Hono();

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
  const createTagUseCase = new CreateTagUseCase(tagRepository);
  const updateTagUseCase = new UpdateTagUseCase(tagRepository);
  const deleteTagUseCase = new DeleteTagUseCase(tagRepository);
  const getTagByIdUseCase = new GetTagByIdUseCase(tagRepository);
  const assignTagToTodoUseCase = new AssignTagToTodoUseCase(tagRepository, todoRepository);
  const removeTagFromTodoUseCase = new RemoveTagFromTodoUseCase(tagRepository, todoRepository);

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

  // Create a new tag
  app.post("/tags", validate("json", CreateTagSchema), async (c) => {
    const data = c.req.valid("json") as {
      name: string;
      color?: string | null;
    };
    const tag = await createTagUseCase.execute({
      name: data.name,
      color: data.color,
    });
    c.status(201);
    return c.json(await convertToResponseSchema(tag, TagSchema));
  });

  // Get a specific tag by id
  app.get("/tags/:id", async (c) => {
    const id = c.req.param("id");
    const tag = await getTagByIdUseCase.execute({ id });
    if (!tag) {
      return c.json({ error: `Tag with ID '${id}' not found` }, 404);
    }
    return c.json(await convertToResponseSchema(tag, TagSchema));
  });

  // Update a tag by id
  app.put("/tags/:id", validate("json", CreateTagSchema), async (c) => {
    const id = c.req.param("id");
    const data = c.req.valid("json") as {
      name: string;
      color?: string | null;
    };
    try {
      const tag = await updateTagUseCase.execute({
        id,
        name: data.name,
        color: data.color,
      });
      return c.json(await convertToResponseSchema(tag, TagSchema));
    } catch (err: any) {
      if (err.name === "TagNotFoundError") {
        return c.json({ error: `Tag with ID '${id}' not found` }, 404);
      }
      throw err;
    }
  });

  // Get todos by tag id
  app.get("/tags/:id/todos", async (c) => {
    const id = c.req.param("id");
    // まずタグが存在するか確認
    const tag = await getTagByIdUseCase.execute({ id });
    if (!tag) {
      return c.json({ error: `Tag with ID '${id}' not found` }, 404);
    }
    const todos = await getTodosByTagUseCase.execute({ tagId: id });
    const response = await Promise.all(todos.map((todo) => convertToResponseSchema(todo, TodoSchema)));
    return c.json(response);
  });

  // Todoにタグを付与
  app.post("/todos/:todoId/tags/:tagId", async (c) => {
    const todoId = c.req.param("todoId");
    const tagId = c.req.param("tagId");
    try {
      await assignTagToTodoUseCase.execute({ todoId, tagId });
      c.status(201);
      return c.body(null);
    } catch (err: any) {
      if (err.name === "TodoNotFoundError" || err.name === "TagNotFoundError") {
        return c.json({ error: err.message }, 404);
      }
      throw err;
    }
  });

  // Todoからタグを削除
  app.delete("/todos/:todoId/tags/:tagId", async (c) => {
    const todoId = c.req.param("todoId");
    const tagId = c.req.param("tagId");
    try {
      await removeTagFromTodoUseCase.execute({ todoId, tagId });
      c.status(204);
      return c.body(null);
    } catch (err: any) {
      if (err.name === "TodoNotFoundError" || err.name === "TagNotFoundError") {
        return c.json({ error: err.message }, 404);
      }
      throw err;
    }
  });

  // Todoに付与されているタグ一覧を取得
  app.get("/todos/:todoId/tags", async (c) => {
    const todoId = c.req.param("todoId");
    try {
      const tags = await getTagsForTodoUseCase.execute({ todoId });
      const response = await Promise.all(tags.map((tag) => convertToResponseSchema(tag, TagSchema)));
      return c.json(response);
    } catch (err: any) {
      if (err.name === "TodoNotFoundError") {
        return c.json({ error: err.message }, 404);
      }
      throw err;
    }
  });

  // Delete a tag by id
  app.delete("/tags/:id", async (c) => {
    const id = c.req.param("id");
    try {
      await deleteTagUseCase.execute({ id });
      c.status(204);
      return c.body(null);
    } catch (err: any) {
      if (err.name === "TagNotFoundError") {
        return c.json({ error: `Tag with ID '${id}' not found` }, 404);
      }
      throw err;
    }
  });
}
