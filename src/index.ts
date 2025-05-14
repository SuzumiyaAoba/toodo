import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { Logger } from "tslog";
import { v4 as uuidv4 } from "uuid";
import { db, todos } from "./db";

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

export default app;
