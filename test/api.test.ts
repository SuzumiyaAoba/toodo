import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";

type Task = {
  id: string;
  parentId: string | null;
  title: string;
  description: string | null;
  status: "completed" | "incomplete";
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

type TaskWithChildren = Task & {
  subtasks: Task[];
};

describe("API Tests", () => {
  let app: Hono;

  // Mock data store for testing
  const taskStore: Record<string, Task> = {};

  beforeAll(() => {
    // Create Hono application for testing
    app = new Hono();

    // Task API
    app.get("/api/tasks", (c) => {
      // Get root tasks (parentId is null)
      const rootTasks = Object.values(taskStore)
        .filter((task) => task.parentId === null)
        .sort((a, b) => a.order - b.order);
      return c.json(rootTasks);
    });

    app.get("/api/tasks/:id", (c) => {
      const taskId = c.req.param("id");
      const task = taskStore[taskId];

      if (!task) {
        return c.json({ error: "Task not found" }, 404);
      }

      // Add subtasks to the response
      const childTasks = Object.values(taskStore)
        .filter((t) => t.parentId === taskId)
        .sort((a, b) => a.order - b.order);

      const taskWithChildren = {
        ...task,
        subtasks: childTasks,
      };

      return c.json(taskWithChildren);
    });

    app.post("/api/tasks", async (c) => {
      const {
        title,
        description = null,
        parentId = null,
      } = await c.req.json<{
        title: string;
        description?: string | null;
        parentId?: string | null;
      }>();

      if (!title) {
        return c.json({ error: "Title is required" }, 400);
      }

      // Validate parent exists if specified
      if (parentId && !taskStore[parentId]) {
        return c.json({ error: "Parent task not found" }, 404);
      }

      // Calculate order (last in the list of siblings)
      const siblings = Object.values(taskStore).filter((task) => task.parentId === parentId);
      const order = siblings.length > 0 ? Math.max(...siblings.map((task) => task.order)) + 1 : 1;

      const newTask: Task = {
        id: uuidv4(),
        parentId,
        title,
        description,
        status: "incomplete",
        order,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      taskStore[newTask.id] = newTask;
      return c.json(newTask, 201);
    });
  });

  beforeEach(() => {
    // Clear data before each test
    for (const key of Object.keys(taskStore)) {
      delete taskStore[key];
    }
  });

  describe("Task API", () => {
    it("should create and retrieve root tasks", async () => {
      // Create a root task
      const newTask = { title: "Test Root Task" };

      const createRes = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTask),
      });

      expect(createRes.status).toBe(201);
      const createdTask = (await createRes.json()) as Task;
      expect(createdTask.title).toBe(newTask.title);
      expect(createdTask.parentId).toBeNull();

      // Retrieve root tasks
      const getRes = await app.request("/api/tasks");
      expect(getRes.status).toBe(200);

      const rootTasks = (await getRes.json()) as Task[];
      expect(rootTasks).toHaveLength(1);
      expect(rootTasks[0].id).toBe(createdTask.id);
    });

    it("should create and retrieve child tasks", async () => {
      // Create a root task first
      const rootTaskData = { title: "Parent Task" };
      const rootTaskRes = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rootTaskData),
      });

      const rootTask = (await rootTaskRes.json()) as Task;
      const parentId = rootTask.id;

      // Create a child task
      const childTaskData = { title: "Child Task", parentId };
      const createRes = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(childTaskData),
      });

      expect(createRes.status).toBe(201);
      const createdChildTask = (await createRes.json()) as Task;
      expect(createdChildTask.title).toBe(childTaskData.title);
      expect(createdChildTask.parentId).toBe(parentId);

      // Retrieve task with its children
      const getRes = await app.request(`/api/tasks/${parentId}`);
      expect(getRes.status).toBe(200);

      const taskWithChildren = (await getRes.json()) as TaskWithChildren;
      expect(taskWithChildren.id).toBe(parentId);
      expect(Array.isArray(taskWithChildren.subtasks)).toBe(true);
      expect(taskWithChildren.subtasks).toHaveLength(1);
      expect(taskWithChildren.subtasks[0].id).toBe(createdChildTask.id);
    });

    it("should create multiple child tasks with proper ordering", async () => {
      // Create a root task first
      const rootTaskData = { title: "Parent Task" };
      const rootTaskRes = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rootTaskData),
      });

      const rootTask = (await rootTaskRes.json()) as Task;
      const parentId = rootTask.id;

      // Create multiple child tasks
      const childTask1 = { title: "Child Task 1", parentId };
      const childTask2 = { title: "Child Task 2", parentId };
      const childTask3 = { title: "Child Task 3", parentId };

      await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(childTask1),
      });

      await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(childTask2),
      });

      await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(childTask3),
      });

      // Retrieve task with its children
      const getRes = await app.request(`/api/tasks/${parentId}`);
      expect(getRes.status).toBe(200);

      const taskWithChildren = (await getRes.json()) as TaskWithChildren;
      expect(taskWithChildren.subtasks).toHaveLength(3);

      // Verify correct ordering
      expect(taskWithChildren.subtasks[0].order).toBe(1);
      expect(taskWithChildren.subtasks[1].order).toBe(2);
      expect(taskWithChildren.subtasks[2].order).toBe(3);

      // Verify titles
      expect(taskWithChildren.subtasks.map((t) => t.title)).toContain(childTask1.title);
      expect(taskWithChildren.subtasks.map((t) => t.title)).toContain(childTask2.title);
      expect(taskWithChildren.subtasks.map((t) => t.title)).toContain(childTask3.title);
    });

    it("should return 404 when creating a task with non-existent parent", async () => {
      // Attempt to create a task with a non-existent parent ID
      const nonExistentParentId = uuidv4(); // Generate a random UUID that doesn't exist
      const taskData = {
        title: "Task with Bad Parent",
        parentId: nonExistentParentId,
      };

      const response = await app.request("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });

      // Verify we get a 404 status code
      expect(response.status).toBe(404);

      // Verify the error message
      const responseBody = await response.json();
      expect(responseBody.error).toBeDefined();
      expect(responseBody.error).toContain("Parent task");
      expect(responseBody.error).toContain("not found");
    });
  });
});
