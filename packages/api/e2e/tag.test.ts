import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Tag, Todo } from "./types";

describe("Tag API", () => {
  const apiPath = "/api/v1";
  let createdTagId: string;
  let createdTodoId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a new tag", async () => {
    const res = await app.request(`${apiPath}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Tag",
        color: "#FF0000",
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as Tag;
    expect(data.name).toBe("Test Tag");
    expect(data.color).toBe("#FF0000");

    createdTagId = data.id;
  });

  test("should get the list of tags", async () => {
    const res = await app.request(`${apiPath}/tags`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Tag[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("should get a specific tag", async () => {
    const res = await app.request(`${apiPath}/tags/${createdTagId}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Tag;
    expect(data.id).toBe(createdTagId);
    expect(data.name).toBe("Test Tag");
  });

  test("should update a tag", async () => {
    const res = await app.request(`${apiPath}/tags/${createdTagId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Tag",
        color: "#00FF00",
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as Tag;
    expect(data.name).toBe("Updated Tag");
    expect(data.color).toBe("#00FF00");
  });

  test("should create a todo and assign a tag", async () => {
    // Create a todo
    const todoRes = await app.request(`${apiPath}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Tagged Todo",
        description: "This is a todo with a tag",
      }),
    });

    expect(todoRes.status).toBe(201);
    const todoData = (await todoRes.json()) as Todo;
    createdTodoId = todoData.id;

    // Assign tag to todo
    const res = await app.request(`${apiPath}/todos/${createdTodoId}/tags/${createdTagId}`, {
      method: "POST",
    });

    expect(res.status).toBe(201);
  });

  test("should get tags for a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${createdTodoId}/tags`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Tag[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]?.id).toBe(createdTagId);
  });

  test("should get todos by tag", async () => {
    const res = await app.request(`${apiPath}/tags/${createdTagId}/todos`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Todo[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]?.id).toBe(createdTodoId);
  });

  test("should remove a tag from a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${createdTodoId}/tags/${createdTagId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    // Verify that the tag is removed from the todo
    const getRes = await app.request(`${apiPath}/todos/${createdTodoId}/tags`);
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as Tag[];
    expect(data.find((tag) => tag.id === createdTagId)).toBeUndefined();
  });

  test("should delete a tag", async () => {
    const res = await app.request(`${apiPath}/tags/${createdTagId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    // Verify that the tag is deleted
    const getRes = await app.request(`${apiPath}/tags/${createdTagId}`);
    expect(getRes.status).toBe(404);
  });
});
