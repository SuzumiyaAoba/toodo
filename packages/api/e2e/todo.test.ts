import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Todo, TodoActivity, TodoWorkTime } from "./types";

describe("Todo API", () => {
  const apiPath = "/api/v1";
  let createdTodoId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a new todo", async () => {
    const res = await app.request(`${apiPath}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Todo",
        description: "This is a test todo",
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as Todo;
    expect(data.title).toBe("Test Todo");
    expect(data.description).toBe("This is a test todo");
    expect(data.status).toBe("pending");
    expect(data.workState).toBe("idle");
    expect(data.totalWorkTime).toBe(0);

    createdTodoId = data.id;
  });

  test("should get the list of todos", async () => {
    const res = await app.request(`${apiPath}/todos`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Todo[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("should get a specific todo", async () => {
    const res = await app.request(`${apiPath}/todos/${createdTodoId}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { todo: Todo; tags: unknown[] };
    expect(data.todo.id).toBe(createdTodoId);
    expect(data.todo.title).toBe("Test Todo");
  });

  test("should update a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${createdTodoId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Updated Todo",
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as Todo;
    expect(data.title).toBe("Updated Todo");
    expect(data.description).toBe("This is a test todo");
  });

  test("should add an activity to a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${createdTodoId}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "started",
        note: "Starting work on this task",
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as TodoActivity;
    expect(data.todoId).toBe(createdTodoId);
    expect(data.type).toBe("started");
    expect(data.note).toBe("Starting work on this task");
  });

  test("should get activities for a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${createdTodoId}/activities`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as TodoActivity[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]?.todoId).toBe(createdTodoId);
  });

  test("should get work time for a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${createdTodoId}/work-time`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as TodoWorkTime;
    expect(data.id).toBe(createdTodoId);
    expect(typeof data.totalWorkTime).toBe("number");
    expect(typeof data.formattedTime).toBe("string");
  });

  test("should delete a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${createdTodoId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    // Verify that the todo is deleted
    const getRes = await app.request(`${apiPath}/todos/${createdTodoId}`);
    expect(getRes.status).toBe(404);
  });
});
