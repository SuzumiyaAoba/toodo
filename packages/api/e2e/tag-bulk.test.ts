import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import app from "../src";
import { prisma, setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Tag, Todo } from "./types";

describe("Tag Bulk Operations API E2E Tests", () => {
  const apiBase = "/api/v1";
  let tagId: string;
  let todoIds: string[] = [];

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await teardownTestDatabase();
    await setupTestDatabase();

    // Create a tag for testing
    const tagResponse = await app.request(`${apiBase}/tags`, {
      method: "POST",
      body: JSON.stringify({
        name: "Bulk Test Tag",
        color: "#ff5733",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const tagData = (await tagResponse.json()) as Tag;
    tagId = tagData.id;

    // Create multiple todos for testing
    const todoPromises = Array.from({ length: 3 }, (_, i) =>
      app.request(`${apiBase}/todos`, {
        method: "POST",
        body: JSON.stringify({
          title: `Bulk Test Todo ${i + 1}`,
          description: `Todo for bulk tag operations test ${i + 1}`,
        }),
        headers: new Headers({ "Content-Type": "application/json" }),
      }),
    );

    const todoResponses = await Promise.all(todoPromises);
    const todos = (await Promise.all(todoResponses.map((r) => r.json()))) as Todo[];
    todoIds = todos.map((todo) => todo.id);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should bulk assign a tag to multiple todos", async () => {
    const response = await app.request(`${apiBase}/tags/${tagId}/bulk-assign`, {
      method: "POST",
      body: JSON.stringify({ todoIds }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as {
      successCount: number;
      failedCount: number;
    };
    expect(responseData.successCount).toBe(todoIds.length);
    expect(responseData.failedCount).toBe(0);

    // Verify todos have the tag
    for (const todoId of todoIds) {
      const todoResponse = await app.request(`${apiBase}/todos/${todoId}`);
      const todoData = (await todoResponse.json()) as Todo & { tags: Tag[] };
      expect(todoData.tags.some((tag) => tag.id === tagId)).toBe(true);
    }
  });

  test("should handle invalid todo IDs in bulk assign", async () => {
    const invalidTodoIds = ["00000000-0000-0000-0000-000000000000", ...todoIds];

    const response = await app.request(`${apiBase}/tags/${tagId}/bulk-assign`, {
      method: "POST",
      body: JSON.stringify({ todoIds: invalidTodoIds }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as {
      successCount: number;
      failedCount: number;
    };
    expect(responseData.successCount).toBe(todoIds.length);
    expect(responseData.failedCount).toBe(1);
  });

  test("should bulk remove a tag from multiple todos", async () => {
    // First, assign tags to todos
    await app.request(`${apiBase}/tags/${tagId}/bulk-assign`, {
      method: "POST",
      body: JSON.stringify({ todoIds }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const response = await app.request(`${apiBase}/tags/${tagId}/bulk-remove`, {
      method: "POST",
      body: JSON.stringify({ todoIds }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as {
      successCount: number;
      failedCount: number;
    };
    expect(responseData.successCount).toBe(todoIds.length);
    expect(responseData.failedCount).toBe(0);

    // Verify todos no longer have the tag
    for (const todoId of todoIds) {
      const todoResponse = await app.request(`${apiBase}/todos/${todoId}`);
      const todoData = (await todoResponse.json()) as Todo & { tags: Tag[] };
      expect(todoData.tags.some((tag) => tag.id === tagId)).toBe(false);
    }
  });

  test("should handle invalid todo IDs in bulk remove", async () => {
    // First, assign tags to todos
    await app.request(`${apiBase}/tags/${tagId}/bulk-assign`, {
      method: "POST",
      body: JSON.stringify({ todoIds }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const invalidTodoIds = ["00000000-0000-0000-0000-000000000000", ...todoIds];

    const response = await app.request(`${apiBase}/tags/${tagId}/bulk-remove`, {
      method: "POST",
      body: JSON.stringify({ todoIds: invalidTodoIds }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as {
      successCount: number;
      failedCount: number;
    };
    expect(responseData.successCount).toBe(todoIds.length);
    expect(responseData.failedCount).toBe(1);
  });
});
