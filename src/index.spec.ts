import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { PrismaClient } from "./generated/prisma";

// Create a Prisma Client for testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./test.db",
    },
  },
});

// Create a Hono app for testing
const app = new Hono();

// Create a TODO
app.post("/todos", async (c) => {
  const { title, description, status } = await c.req.json();
  const todo = await prisma.todo.create({
    data: { title, description, status },
  });
  return c.json(todo, 201);
});

// Get TODO list
app.get("/todos", async (c) => {
  const todos = await prisma.todo.findMany();
  return c.json(todos);
});

// Get TODO details
app.get("/todos/:id", async (c) => {
  const id = c.req.param("id");
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) return c.json({ error: "Todo not found" }, 404);
  return c.json(todo);
});

// Update a TODO
app.put("/todos/:id", async (c) => {
  const id = c.req.param("id");
  const { title, description, status } = await c.req.json();
  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: { title, description, status },
    });
    return c.json(todo);
  } catch (error) {
    return c.json({ error: "Todo not found" }, 404);
  }
});

// Delete a TODO
app.delete("/todos/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await prisma.todo.delete({ where: { id } });
    c.status(204);
    return c.body(null);
  } catch (error) {
    return c.json({ error: "Todo not found" }, 404);
  }
});

beforeAll(async () => {
  // Set up the test database
  const { execSync } = await import("node:child_process");
  execSync('DATABASE_URL="file:./test.db" npx prisma migrate dev --name test-setup --skip-generate', {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
});

beforeEach(async () => {
  // Clear data before each test
  await prisma.todo.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("TODO API", () => {
  it("can create a TODO", async () => {
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Test TODO",
        description: "This is a test TODO",
        status: "pending",
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("Test TODO");
    expect(data.description).toBe("This is a test TODO");
    expect(data.status).toBe("pending");
  });

  it("can get the TODO list", async () => {
    const response = await app.request("/todos", {
      method: "GET",
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("can get TODO details", async () => {
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Detail Test",
        description: "Detail Test Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "GET",
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Detail Test");
    expect(data.description).toBe("Detail Test Description");
  });

  it("can update a TODO", async () => {
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Update Test",
        description: "Update Test Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: "Updated Title",
        description: "Updated Description",
        status: "completed",
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Updated Title");
    expect(data.description).toBe("Updated Description");
    expect(data.status).toBe("completed");
  });

  it("can delete a TODO", async () => {
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Delete Test",
        description: "Delete Test Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    const getResponse = await app.request(`/todos/${createdTodo.id}`, {
      method: "GET",
    });
    expect(getResponse.status).toBe(404);
  });
});
