import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type { Hono } from "hono";
import app from ".";
import { PrismaClient } from "./generated/prisma";

describe("Toodo API", () => {
  let server: { url: string };
  let prisma: PrismaClient;
  let createdTodoId: string;

  // Setup
  beforeAll(async () => {
    // Start the server
    server = { url: "http://localhost:3333" };
    Bun.serve({
      port: 3333,
      fetch: (app as unknown as Hono).fetch,
    });

    // Initialize Prisma client
    prisma = new PrismaClient();

    // Clear the database
    await prisma.todoActivity.deleteMany();
    await prisma.todo.deleteMany();
  });

  // Teardown
  afterAll(async () => {
    // Clear the database
    await prisma.todoActivity.deleteMany();
    await prisma.todo.deleteMany();
    await prisma.$disconnect();
  });

  // Tests
  test("should create a new todo", async () => {
    const response = await fetch(`${server.url}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Todo",
        description: "This is a test todo",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.title).toBe("Test Todo");
    expect(data.description).toBe("This is a test todo");
    expect(data.status).toBe("pending");
    expect(data.workState).toBe("idle");
    expect(data.totalWorkTime).toBe(0);

    // Save the ID for subsequent tests
    createdTodoId = data.id;
  });

  test("should get the list of todos", async () => {
    const response = await fetch(`${server.url}/todos`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("should get a specific todo", async () => {
    const response = await fetch(`${server.url}/todos/${createdTodoId}`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(createdTodoId);
    expect(data.title).toBe("Test Todo");
  });

  test("should update a todo", async () => {
    const response = await fetch(`${server.url}/todos/${createdTodoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Updated Todo",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.title).toBe("Updated Todo");
    expect(data.description).toBe("This is a test todo");
  });

  test("should add an activity to a todo", async () => {
    const response = await fetch(`${server.url}/todos/${createdTodoId}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "started",
        note: "Starting work on this task",
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.todoId).toBe(createdTodoId);
    expect(data.type).toBe("started");
    expect(data.note).toBe("Starting work on this task");
  });

  test("should get activities for a todo", async () => {
    const response = await fetch(`${server.url}/todos/${createdTodoId}/activities`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].todoId).toBe(createdTodoId);
  });

  test("should get work time for a todo", async () => {
    const response = await fetch(`${server.url}/todos/${createdTodoId}/work-time`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(createdTodoId);
    expect(typeof data.totalWorkTime).toBe("number");
    expect(typeof data.formattedTime).toBe("string");
  });

  test("should delete a todo", async () => {
    const response = await fetch(`${server.url}/todos/${createdTodoId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    // Verify that the todo is deleted
    const getResponse = await fetch(`${server.url}/todos/${createdTodoId}`);
    expect(getResponse.status).toBe(404);
  });
});
