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
  const updateData = await c.req.json();

  // Fetch the existing TODO
  const existingTodo = await prisma.todo.findUnique({ where: { id } });
  if (!existingTodo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  // Update only the fields specified in the request
  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        // Only update fields that are not undefined
        ...(updateData.title !== undefined && { title: updateData.title }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.status !== undefined && { status: updateData.status }),
      },
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

  it("can partially update a TODO - only title", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Partial Update Test",
        description: "Original Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Partially update only the title
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: "Updated Title Only",
      }),
    });
    const data = await response.json();

    // 3. Verify that only the title was updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Updated Title Only");
    expect(data.description).toBe("Original Description"); // Should remain unchanged
    expect(data.status).toBe("pending"); // Should remain unchanged
  });

  it("can partially update a TODO - only status", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Status Update Test",
        description: "Status Test Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Partially update only the status
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        status: "completed",
      }),
    });
    const data = await response.json();

    // 3. Verify that only the status was updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Status Update Test"); // Should remain unchanged
    expect(data.description).toBe("Status Test Description"); // Should remain unchanged
    expect(data.status).toBe("completed"); // Should be updated
  });

  it("can partially update a TODO - only description", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Description Update Test",
        description: "Original Description Text",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Partially update only the description
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        description: "Updated Description Only",
      }),
    });
    const data = await response.json();

    // 3. Verify that only the description was updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Description Update Test"); // Should remain unchanged
    expect(data.description).toBe("Updated Description Only"); // Should be updated
    expect(data.status).toBe("pending"); // Should remain unchanged
  });

  it("can update multiple fields but not all fields", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Multiple Fields Test",
        description: "Original Multiple Fields Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Update title and status but not description
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: "Updated Multiple Fields",
        status: "completed",
      }),
    });
    const data = await response.json();

    // 3. Verify that only specified fields were updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Updated Multiple Fields"); // Should be updated
    expect(data.description).toBe("Original Multiple Fields Description"); // Should remain unchanged
    expect(data.status).toBe("completed"); // Should be updated
  });

  it("handles empty update objects gracefully", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Empty Update Test",
        description: "Empty Update Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Send an empty update object
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    const data = await response.json();

    // 3. Verify that no fields were updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Empty Update Test"); // Should remain unchanged
    expect(data.description).toBe("Empty Update Description"); // Should remain unchanged
    expect(data.status).toBe("pending"); // Should remain unchanged
  });
});
