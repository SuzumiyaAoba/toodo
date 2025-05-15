import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";

interface Todo {
  id: string;
  content: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Subtask {
  id: string;
  todoId: string;
  title: string;
  description: string | null;
  status: "completed" | "incomplete";
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

describe("API Tests", () => {
  let app: Hono;

  // テスト用のモックデータストア
  const todoStore: Record<string, Todo> = {};
  const subtaskStore: Record<string, Subtask> = {};

  beforeAll(() => {
    // テスト用のHonoアプリケーションを作成
    app = new Hono();

    // Todo API
    app.get("/api/todos", (c) => {
      const todos = Object.values(todoStore);
      return c.json(todos);
    });

    app.post("/api/todos", async (c) => {
      const { content } = await c.req.json<{ content: string }>();
      if (!content) {
        return c.json({ error: "Content is required" }, 400);
      }

      const newTodo: Todo = {
        id: uuidv4(),
        content,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      todoStore[newTodo.id] = newTodo;
      return c.json(newTodo, 201);
    });

    // Subtask API
    app.get("/api/todos/:todoId/subtasks", (c) => {
      const todoId = c.req.param("todoId");

      // Todo existence check
      if (!todoStore[todoId]) {
        return c.json({ error: "Todo not found" }, 404);
      }

      // Get subtasks for todo
      const subtasks = Object.values(subtaskStore)
        .filter((subtask) => subtask.todoId === todoId)
        .sort((a, b) => a.order - b.order);

      return c.json(subtasks);
    });

    app.post("/api/todos/:todoId/subtasks", async (c) => {
      const todoId = c.req.param("todoId");
      const { title, description = null } = await c.req.json<{
        title: string;
        description?: string | null;
      }>();

      if (!title) {
        return c.json({ error: "Title is required" }, 400);
      }

      // Todo existence check
      if (!todoStore[todoId]) {
        return c.json({ error: "Todo not found" }, 404);
      }

      // Get existing subtasks to calculate next order
      const existingSubtasks = Object.values(subtaskStore).filter((subtask) => subtask.todoId === todoId);

      const maxOrder = existingSubtasks.length > 0 ? Math.max(...existingSubtasks.map((subtask) => subtask.order)) : 0;

      const newSubtask: Subtask = {
        id: uuidv4(),
        todoId,
        title,
        description,
        status: "incomplete",
        order: maxOrder + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      subtaskStore[newSubtask.id] = newSubtask;
      return c.json(newSubtask, 201);
    });
  });

  beforeEach(() => {
    // 各テスト前にデータをクリアする
    for (const key of Object.keys(todoStore)) {
      delete todoStore[key];
    }
    for (const key of Object.keys(subtaskStore)) {
      delete subtaskStore[key];
    }
  });

  describe("Todo API", () => {
    it("should create and retrieve todos", async () => {
      // Todoを作成
      const newTodo = { content: "Test Todo" };

      const createRes = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTodo),
      });

      expect(createRes.status).toBe(201);
      const createdTodo = (await createRes.json()) as Todo;
      expect(createdTodo.content).toBe(newTodo.content);

      // Todoリストを取得
      const getRes = await app.request("/api/todos");
      expect(getRes.status).toBe(200);

      const todos = (await getRes.json()) as Todo[];
      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe(createdTodo.id);
    });
  });

  describe("Subtask API", () => {
    it("should create and retrieve subtasks", async () => {
      // 先にTodoを作成
      const todoData = { content: "Parent Todo" };
      const todoRes = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todoData),
      });

      const todo = (await todoRes.json()) as Todo;
      const todoId = todo.id;

      // サブタスクを作成
      const subtaskData = { title: "Test Subtask" };
      const createRes = await app.request(`/api/todos/${todoId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtaskData),
      });

      expect(createRes.status).toBe(201);
      const createdSubtask = (await createRes.json()) as Subtask;
      expect(createdSubtask.title).toBe(subtaskData.title);
      expect(createdSubtask.todoId).toBe(todoId);

      // サブタスクリストを取得
      const getRes = await app.request(`/api/todos/${todoId}/subtasks`);
      expect(getRes.status).toBe(200);

      const subtasks = (await getRes.json()) as Subtask[];
      expect(subtasks).toHaveLength(1);
      expect(subtasks[0].id).toBe(createdSubtask.id);
    });

    it("should create multiple subtasks with proper ordering", async () => {
      // 先にTodoを作成
      const todoData = { content: "Parent Todo" };
      const todoRes = await app.request("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(todoData),
      });

      const todo = (await todoRes.json()) as Todo;
      const todoId = todo.id;

      // 複数のサブタスクを作成
      const subtask1 = { title: "Subtask 1" };
      const subtask2 = { title: "Subtask 2" };
      const subtask3 = { title: "Subtask 3" };

      await app.request(`/api/todos/${todoId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtask1),
      });

      await app.request(`/api/todos/${todoId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtask2),
      });

      await app.request(`/api/todos/${todoId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subtask3),
      });

      // サブタスクリストを取得して順序を確認
      const getRes = await app.request(`/api/todos/${todoId}/subtasks`);
      expect(getRes.status).toBe(200);

      const subtasks = (await getRes.json()) as Subtask[];
      expect(subtasks).toHaveLength(3);

      // 順序が正しく設定されていることを確認
      expect(subtasks[0].order).toBe(1);
      expect(subtasks[1].order).toBe(2);
      expect(subtasks[2].order).toBe(3);

      // タイトルが正しいことを確認
      expect(subtasks.map((s) => s.title)).toContain(subtask1.title);
      expect(subtasks.map((s) => s.title)).toContain(subtask2.title);
      expect(subtasks.map((s) => s.title)).toContain(subtask3.title);
    });
  });
});
