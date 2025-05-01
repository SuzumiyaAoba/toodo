import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Todo } from "./types";

describe("Todo Subtask API", () => {
  const apiPath = "/api/v1";
  let parentTodoId: string;
  let subtaskId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create todos for subtask testing", async () => {
    // Create parent todo
    const res1 = await app.request(`${apiPath}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Parent Todo",
        description: "This is the parent todo",
      }),
    });

    expect(res1.status).toBe(201);
    const data1 = (await res1.json()) as Todo;
    parentTodoId = data1.id;

    // Create subtask
    const res2 = await app.request(`${apiPath}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Subtask Todo",
        description: "This todo is a subtask",
      }),
    });

    expect(res2.status).toBe(201);
    const data2 = (await res2.json()) as Todo;
    subtaskId = data2.id;
  });

  test("should add a subtask to a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${parentTodoId}/subtasks/${subtaskId}`, {
      method: "POST",
    });

    expect(res.status).toBe(201);

    // Verify the subtask was added
    const getRes = await app.request(`${apiPath}/todos/${parentTodoId}/subtasks`);
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as Todo[];
    expect(data.find((todo) => todo.id === subtaskId)).toBeDefined();
  });

  test("should get subtasks of a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${parentTodoId}/subtasks`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Todo[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]?.id).toBe(subtaskId);
  });

  test("should get parent todo of a subtask", async () => {
    const res = await app.request(`${apiPath}/todos/${subtaskId}/parent`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Todo;
    expect(data.id).toBe(parentTodoId);
  });

  test("should remove a subtask from a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${parentTodoId}/subtasks/${subtaskId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    // Verify the subtask was removed
    const getRes = await app.request(`${apiPath}/todos/${parentTodoId}/subtasks`);
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as Todo[];
    expect(data.find((todo) => todo.id === subtaskId)).toBeUndefined();
  });

  test("should not allow circular subtask relationships", async () => {
    // Try to create a circular subtask relationship
    const res = await app.request(`${apiPath}/todos/${subtaskId}/subtasks/${parentTodoId}`, {
      method: "POST",
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
