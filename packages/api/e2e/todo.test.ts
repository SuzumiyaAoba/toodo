import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { prisma, setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Todo, TodoActivity, TodoWorkTime } from "./types";

describe("Todo API E2E Tests", () => {
  const apiBase = "/api/v1";
  let createdTodoId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a new todo successfully", async () => {
    const todoData = {
      title: "Todo for E2E test",
      description: "This todo is used for E2E test validation.",
      priority: "high" as const,
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
    expect(responseData.description).toBe(todoData.description);
    expect(responseData.priority).toBe(todoData.priority);
    expect(responseData.status).toBe("pending");
    expect(responseData.workState).toBe("idle");

    createdTodoId = responseData.id;
  });

  test("should get the list of all todos", async () => {
    const response = await app.request(`${apiBase}/todos`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // Check that the created todo is included
    const foundTodo = responseData.find((todo) => todo.id === createdTodoId);
    expect(foundTodo).toBeDefined();
  });

  test("should get a todo by ID", async () => {
    const response = await app.request(`${apiBase}/todos/${createdTodoId}`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo;
    expect(responseData).toHaveProperty("id", createdTodoId);
    expect(responseData).toHaveProperty("title", "Todo for E2E test");
  });

  test("should return 404 when accessing a non-existent todo", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const response = await app.request(`${apiBase}/todos/${nonExistentId}`);

    expect(response.status).toBe(404);
  });

  test("should update a todo successfully", async () => {
    const updateData = {
      title: "Updated todo title",
      status: "completed",
    };

    const response = await app.request(`${apiBase}/todos/${createdTodoId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo;
    expect(responseData).toHaveProperty("title", updateData.title);
    expect(responseData).toHaveProperty("status", updateData.status);
    // Check that the description is retained
    expect(responseData).toHaveProperty("description", "This todo is used for E2E test validation.");
  });

  test("should add and get todo activities", async () => {
    // Add activity
    const activityData = {
      type: "started",
      note: "Start work in E2E test",
    };

    const createResponse = await app.request(`${apiBase}/todos/${createdTodoId}/activities`, {
      method: "POST",
      body: JSON.stringify(activityData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(createResponse.status).toBe(201);
    const createResponseData = (await createResponse.json()) as TodoActivity;
    expect(createResponseData).toHaveProperty("todoId", createdTodoId);
    expect(createResponseData).toHaveProperty("type", activityData.type);
    expect(createResponseData).toHaveProperty("note", activityData.note);

    // Get activity list
    const listResponse = await app.request(`${apiBase}/todos/${createdTodoId}/activities`);

    expect(listResponse.status).toBe(200);
    const listResponseData = (await listResponse.json()) as TodoActivity[];
    expect(Array.isArray(listResponseData)).toBe(true);
    expect(listResponseData.length).toBeGreaterThan(0);

    // Check that the added activity is included
    const foundActivity = listResponseData.find(
      (activity) => activity.type === activityData.type && activity.note === activityData.note,
    );
    expect(foundActivity).toBeDefined();
  });

  test("should get work time for a todo", async () => {
    // Add completed activity to generate work time
    await app.request(`${apiBase}/todos/${createdTodoId}/activities`, {
      method: "POST",
      body: JSON.stringify({
        type: "completed",
        note: "Complete work in E2E test",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const response = await app.request(`${apiBase}/todos/${createdTodoId}/work-time`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as TodoWorkTime;
    expect(responseData).toHaveProperty("id", createdTodoId);
    expect(responseData).toHaveProperty("totalWorkTime");
    expect(responseData).toHaveProperty("formattedTime");
  });

  test("should delete a todo successfully", async () => {
    const deleteResponse = await app.request(`${apiBase}/todos/${createdTodoId}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    // Check that 404 is returned after deletion
    const getResponse = await app.request(`${apiBase}/todos/${createdTodoId}`);
    expect(getResponse.status).toBe(404);
  });

  test("should update todo due date", async () => {
    const todoData = {
      title: "Todo with due date",
      description: "This todo has a due date",
    };

    // Create a new todo
    const createResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const todo = (await createResponse.json()) as Todo;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Set due date to 7 days from now

    // Update due date
    const response = await app.request(`${apiBase}/todos/${todo.id}/due-date`, {
      method: "PUT",
      body: JSON.stringify({ dueDate: dueDate.toISOString() }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo;
    expect(responseData).toHaveProperty("dueDate");
    expect(new Date(responseData.dueDate!).toISOString()).toBe(dueDate.toISOString());
  });

  test("should get overdue todos", async () => {
    const todoData = {
      title: "Overdue todo",
      description: "This todo is overdue",
    };

    // Create a new todo
    const createResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const todo = (await createResponse.json()) as Todo;
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 1); // Set due date to yesterday

    // Set overdue date
    await app.request(`${apiBase}/todos/${todo.id}/due-date`, {
      method: "PUT",
      body: JSON.stringify({ dueDate: overdueDate.toISOString() }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    // Get overdue todos
    const response = await app.request(`${apiBase}/todos/overdue`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);
    expect(responseData.some((t) => t.id === todo.id)).toBe(true);
  });

  test("should get todos due soon", async () => {
    const todoData = {
      title: "Todo due soon",
      description: "This todo is due soon",
    };

    // Create a new todo
    const createResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const todo = (await createResponse.json()) as Todo;
    const dueSoonDate = new Date();
    dueSoonDate.setDate(dueSoonDate.getDate() + 1); // Set due date to tomorrow

    // Set due soon date
    await app.request(`${apiBase}/todos/${todo.id}/due-date`, {
      method: "PUT",
      body: JSON.stringify({ dueDate: dueSoonDate.toISOString() }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    // Get todos due soon
    const response = await app.request(`${apiBase}/todos/due-soon`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);
    expect(responseData.some((t) => t.id === todo.id)).toBe(true);
  });

  test("should filter todos by status and priority", async () => {
    const todoData = {
      title: "High priority in-progress todo",
      description: "This todo is high priority and in progress",
      status: "in_progress",
      priority: "high" as const,
    };

    // Create a new todo
    await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    // Filter by status
    const statusResponse = await app.request(`${apiBase}/todos?status=in_progress`);
    expect(statusResponse.status).toBe(200);
    const statusData = (await statusResponse.json()) as Todo[];
    expect(statusData.some((todo) => todo.status === "in_progress")).toBe(true);

    // Filter by priority
    const priorityResponse = await app.request(`${apiBase}/todos?priority=high`);
    expect(priorityResponse.status).toBe(200);
    const priorityData = (await priorityResponse.json()) as Todo[];
    expect(priorityData.some((todo) => todo.priority === "high")).toBe(true);

    // Filter by both status and priority
    const combinedResponse = await app.request(`${apiBase}/todos?status=in_progress&priority=high`);
    expect(combinedResponse.status).toBe(200);
    const combinedData = (await combinedResponse.json()) as Todo[];
    expect(combinedData.some((todo) => todo.status === "in_progress" && todo.priority === "high")).toBe(true);
  });
});
