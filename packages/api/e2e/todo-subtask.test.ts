import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { prisma, setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Todo } from "./types";

describe("Todo Subtask API E2E Tests", () => {
  const apiBase = "/api/v1";
  let parentTodoId: string;
  let subtaskId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a parent todo successfully", async () => {
    const todoData = {
      title: "Parent Todo",
      description: "This is a parent todo",
      priority: "high",
    };

    const response = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(201);
    const responseData = (await response.json()) as Todo;
    expect(responseData).toHaveProperty("id");
    expect(responseData.title).toBe(todoData.title);

    parentTodoId = responseData.id;
  });

  test("should create a subtask directly", async () => {
    const subtaskData = {
      title: "Direct Subtask",
      description: "This is a directly created subtask",
      priority: "medium",
    };

    const response = await app.request(`${apiBase}/todos/${parentTodoId}/create-subtask`, {
      method: "POST",
      body: JSON.stringify(subtaskData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(201);
    const responseData = (await response.json()) as Todo;
    expect(responseData).toHaveProperty("id");
    expect(responseData.title).toBe(subtaskData.title);

    subtaskId = responseData.id;
  });

  test("should add an existing todo as a subtask", async () => {
    // Create another todo to be added as a subtask
    const todoData = {
      title: "Existing Todo to be Subtask",
      description: "This todo will be added as a subtask",
    };

    const createResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const newTodo = (await createResponse.json()) as Todo;

    // Add as subtask
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/subtasks/${newTodo.id}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(201);
    const responseData = (await response.json()) as {
      success: boolean;
      message: string;
    };
    expect(responseData.success).toBe(true);
  });

  test("should get subtasks of a todo", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/subtasks`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);
    expect(responseData.some((todo) => todo.id === subtaskId)).toBe(true);
  });

  test("should get subtask tree", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/subtask-tree`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as {
      id: string;
      title: string;
      subtasks: Array<{
        id: string;
        title: string;
        subtasks: any[];
      }>;
    }[];

    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    const parentTodo = responseData[0]!;
    expect(parentTodo.id).toBe(parentTodoId);
    expect(parentTodo.subtasks).toBeDefined();
    expect(Array.isArray(parentTodo.subtasks)).toBe(true);
    expect(parentTodo.subtasks.length).toBeGreaterThan(0);
  });

  test("should prevent circular subtask relationships", async () => {
    // Try to add parent as subtask of its own subtask
    const response = await app.request(`${apiBase}/todos/${subtaskId}/subtasks/${parentTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as {
      error: { message: string };
    };
    expect(responseData.error.message).toBeDefined();
  });

  test("should remove a subtask relationship", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/subtasks/${subtaskId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    // Verify the subtask was removed
    const checkResponse = await app.request(`${apiBase}/todos/${parentTodoId}/subtasks`);
    const checkData = (await checkResponse.json()) as Todo[];
    expect(checkData.some((todo) => todo.id === subtaskId)).toBe(false);
  });
});
