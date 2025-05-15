import { asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { Logger } from "tslog";
import { v4 as uuidv4 } from "uuid";
import { db, subtasks, todos } from "./db";

const logger = new Logger({ name: "api" });
const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Todo API
app.get("/api/todos", async (c) => {
  try {
    const todoList = await db.select().from(todos).all();
    return c.json(todoList);
  } catch (error) {
    logger.error("Failed to get todos:", error);
    return c.json({ error: "Failed to get todos" }, 500);
  }
});

app.post("/api/todos", async (c) => {
  try {
    const { content } = await c.req.json();
    if (!content) {
      return c.json({ error: "Content is required" }, 400);
    }

    const newTodo = {
      id: uuidv4(),
      content,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(todos).values(newTodo);
    return c.json(newTodo, 201);
  } catch (error) {
    logger.error("Failed to create todo:", error);
    return c.json({ error: "Failed to create todo" }, 500);
  }
});

app.patch("/api/todos/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { content, completed } = await c.req.json();

    const updatedTodo = {
      ...(content !== undefined && { content }),
      ...(completed !== undefined && { completed }),
      updatedAt: new Date(),
    };

    await db.update(todos).set(updatedTodo).where(eq(todos.id, id));

    const todo = await db.select().from(todos).where(eq(todos.id, id)).get();

    if (!todo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json(todo);
  } catch (error) {
    logger.error("Failed to update todo:", error);
    return c.json({ error: "Failed to update todo" }, 500);
  }
});

app.delete("/api/todos/:id", async (c) => {
  try {
    const id = c.req.param("id");

    await db.delete(todos).where(eq(todos.id, id));

    return c.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete todo:", error);
    return c.json({ error: "Failed to delete todo" }, 500);
  }
});

// Subtask API
app.get("/api/todos/:todoId/subtasks", async (c) => {
  try {
    const todoId = c.req.param("todoId");

    // Todo existence check
    const todo = await db.select().from(todos).where(eq(todos.id, todoId)).get();
    if (!todo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    // Get subtasks ordered by order field
    const subtaskList = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.todoId, todoId))
      .orderBy(asc(subtasks.order))
      .all();

    return c.json(subtaskList);
  } catch (error) {
    logger.error("Failed to get subtasks:", error);
    return c.json({ error: "Failed to get subtasks" }, 500);
  }
});

app.post("/api/todos/:todoId/subtasks", async (c) => {
  try {
    const todoId = c.req.param("todoId");
    const { title, description = null } = await c.req.json();

    if (!title) {
      return c.json({ error: "Title is required" }, 400);
    }

    // Todo existence check
    const todo = await db.select().from(todos).where(eq(todos.id, todoId)).get();
    if (!todo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    // Get all subtasks to find the max order value
    const allSubtasks = await db.select().from(subtasks).where(eq(subtasks.todoId, todoId)).all();

    // Calculate max order
    const maxOrder = allSubtasks.length > 0 ? Math.max(...allSubtasks.map((subtask) => subtask.order)) : 0;
    const newOrder = maxOrder + 1;

    const newSubtask = {
      id: uuidv4(),
      todoId,
      title,
      description,
      status: "incomplete" as const,
      order: newOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(subtasks).values(newSubtask);
    return c.json(newSubtask, 201);
  } catch (error) {
    logger.error("Failed to create subtask:", error);
    return c.json({ error: "Failed to create subtask" }, 500);
  }
});

app.put("/api/subtasks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const { title, description, status } = await c.req.json();

    // Validate status if provided
    if (status && !["completed", "incomplete"].includes(status)) {
      return c.json({ error: "Invalid status. Must be 'completed' or 'incomplete'" }, 400);
    }

    const updatedSubtask = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    };

    await db.update(subtasks).set(updatedSubtask).where(eq(subtasks.id, id));

    const subtask = await db.select().from(subtasks).where(eq(subtasks.id, id)).get();

    if (!subtask) {
      return c.json({ error: "Subtask not found" }, 404);
    }

    // If subtask was marked as completed or incomplete, check if all subtasks are completed
    if (status !== undefined) {
      const allSubtasks = await db.select().from(subtasks).where(eq(subtasks.todoId, subtask.todoId)).all();

      const allCompleted = allSubtasks.every((s) => s.status === "completed");

      // Update parent todo if all subtasks are completed
      if (allCompleted) {
        await db.update(todos).set({ completed: true, updatedAt: new Date() }).where(eq(todos.id, subtask.todoId));
      } else {
        await db.update(todos).set({ completed: false, updatedAt: new Date() }).where(eq(todos.id, subtask.todoId));
      }
    }

    return c.json(subtask);
  } catch (error) {
    logger.error("Failed to update subtask:", error);
    return c.json({ error: "Failed to update subtask" }, 500);
  }
});

app.delete("/api/subtasks/:id", async (c) => {
  try {
    const id = c.req.param("id");

    // Get subtask to check if it exists and to get todoId
    const subtask = await db.select().from(subtasks).where(eq(subtasks.id, id)).get();

    if (!subtask) {
      return c.json({ error: "Subtask not found" }, 404);
    }

    await db.delete(subtasks).where(eq(subtasks.id, id));

    // Reorder remaining subtasks
    const remainingSubtasks = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.todoId, subtask.todoId))
      .orderBy(asc(subtasks.order))
      .all();

    // Update orders to be sequential
    for (let i = 0; i < remainingSubtasks.length; i++) {
      await db
        .update(subtasks)
        .set({ order: i + 1, updatedAt: new Date() })
        .where(eq(subtasks.id, remainingSubtasks[i].id));
    }

    // Check if all remaining subtasks are completed
    const allCompleted = remainingSubtasks.every((s) => s.status === "completed");

    // Update parent todo completion status
    await db
      .update(todos)
      .set({
        completed: remainingSubtasks.length > 0 ? allCompleted : false,
        updatedAt: new Date(),
      })
      .where(eq(todos.id, subtask.todoId));

    return c.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete subtask:", error);
    return c.json({ error: "Failed to delete subtask" }, 500);
  }
});

app.put("/api/todos/:todoId/subtasks/reorder", async (c) => {
  try {
    const todoId = c.req.param("todoId");
    const { orderMap } = await c.req.json();

    if (!orderMap || typeof orderMap !== "object") {
      return c.json({ error: "orderMap is required and must be an object" }, 400);
    }

    // Todo existence check
    const todo = await db.select().from(todos).where(eq(todos.id, todoId)).get();
    if (!todo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    // Get all subtasks for this todo
    const allSubtasks = await db.select().from(subtasks).where(eq(subtasks.todoId, todoId)).all();

    const subtaskIds = new Set(allSubtasks.map((s) => s.id));

    // Validate that all keys in orderMap are valid subtask IDs
    for (const id of Object.keys(orderMap)) {
      if (!subtaskIds.has(id)) {
        return c.json({ error: `Invalid subtask ID: ${id}` }, 400);
      }
    }

    // Update orders
    for (const [id, order] of Object.entries(orderMap)) {
      if (typeof order !== "number" || order < 1) {
        return c.json({ error: "Order values must be positive numbers" }, 400);
      }

      await db.update(subtasks).set({ order, updatedAt: new Date() }).where(eq(subtasks.id, id));
    }

    // Return updated subtasks in order
    const updatedSubtasks = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.todoId, todoId))
      .orderBy(asc(subtasks.order))
      .all();

    return c.json(updatedSubtasks);
  } catch (error) {
    logger.error("Failed to reorder subtasks:", error);
    return c.json({ error: "Failed to reorder subtasks" }, 500);
  }
});

export default app;

// For direct execution with bun run
if (import.meta.main) {
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001;
  console.log(`Server listening on http://localhost:${port}`);
  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
