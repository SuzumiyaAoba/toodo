import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { prisma, setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Tag, Todo } from "./types";

describe("Tag API E2E Tests", () => {
  const apiBase = "/api/v1";
  let createdTagId: string;
  let createdTodoId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create a todo for testing
    const todoResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify({
        title: "Todo for tag test",
        description: "This todo is used for E2E tag test.",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const todoData = (await todoResponse.json()) as Todo;
    createdTodoId = todoData.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a new tag successfully", async () => {
    const tagData = {
      name: "Tag for E2E test",
      color: "#ff5733",
    };

    const response = await app.request(`${apiBase}/tags`, {
      method: "POST",
      body: JSON.stringify(tagData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(201);
    const responseData = (await response.json()) as Tag;
    expect(responseData).toHaveProperty("id");
    expect(responseData.name).toBe(tagData.name);
    expect(responseData.color).toBe(tagData.color);

    createdTagId = responseData.id;
  });

  test("should get the list of all tags", async () => {
    const response = await app.request(`${apiBase}/tags`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Tag[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // Check that the created tag is included
    const foundTag = responseData.find((tag) => tag.id === createdTagId);
    expect(foundTag).toBeDefined();
  });

  test("should get a tag by ID", async () => {
    const response = await app.request(`${apiBase}/tags/${createdTagId}`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Tag;
    expect(responseData).toHaveProperty("id", createdTagId);
    expect(responseData).toHaveProperty("name", "Tag for E2E test");
  });

  test("should return 404 when accessing a non-existent tag", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const response = await app.request(`${apiBase}/tags/${nonExistentId}`);

    expect(response.status).toBe(404);
  });

  test("should update a tag successfully", async () => {
    const updateData = {
      name: "Updated tag name",
      color: "#33ff57",
    };

    const response = await app.request(`${apiBase}/tags/${createdTagId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Tag;
    expect(responseData).toHaveProperty("name", updateData.name);
    expect(responseData).toHaveProperty("color", updateData.color);
  });

  test("should assign a tag to a todo", async () => {
    const response = await app.request(`${apiBase}/todos/${createdTodoId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tagId: createdTagId }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(201);
  });

  test("should get todos by tag", async () => {
    const response = await app.request(`${apiBase}/tags/${createdTagId}/todos`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // Check that the created todo is included
    const foundTodo = responseData.find((todo) => todo.id === createdTodoId);
    expect(foundTodo).toBeDefined();
  });

  test("should remove a tag from a todo", async () => {
    const response = await app.request(`${apiBase}/todos/${createdTodoId}/tags/${createdTagId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);
  });

  test("should delete a tag successfully", async () => {
    const deleteResponse = await app.request(`${apiBase}/tags/${createdTagId}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    // Check that 404 is returned after deletion
    const getResponse = await app.request(`${apiBase}/tags/${createdTagId}`);
    expect(getResponse.status).toBe(404);
  });
});
