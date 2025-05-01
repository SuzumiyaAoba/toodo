import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import app from "../src";
import { setupTestDatabase, teardownTestDatabase } from "./setup";
import type { BulkOperationResponse, Tag, Todo } from "./types";

describe("Tag Bulk Operations API", () => {
  const apiPath = "/api/v1";
  let tagId: string;
  const todoIds: string[] = [];

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await teardownTestDatabase();
    await setupTestDatabase();

    // Reset todoIds for each test
    todoIds.length = 0;

    // Create a tag for testing
    const tagRes = await app.request(`${apiPath}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Bulk Test Tag",
        color: "#ff5733",
      }),
    });

    expect(tagRes.status).toBe(201);
    const tagData = (await tagRes.json()) as Tag;
    tagId = tagData.id;

    // Create multiple todos for testing
    for (let i = 0; i < 3; i++) {
      const todoRes = await app.request(`${apiPath}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Bulk Test Todo ${i + 1}`,
          description: `Todo for bulk tag operations test ${i + 1}`,
        }),
      });

      expect(todoRes.status).toBe(201);
      const todoData = (await todoRes.json()) as Todo;
      todoIds.push(todoData.id);
    }
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a tag and multiple todos for bulk operations", async () => {
    // Create a tag
    const tagRes = await app.request(`${apiPath}/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Bulk Tag",
        color: "#FF0000",
      }),
    });

    expect(tagRes.status).toBe(201);
    const tagData = (await tagRes.json()) as Tag;
    tagId = tagData.id;

    // Create multiple todos
    for (let i = 0; i < 3; i++) {
      const todoRes = await app.request(`${apiPath}/todos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Bulk Todo ${i + 1}`,
          description: `This is bulk todo ${i + 1}`,
        }),
      });

      expect(todoRes.status).toBe(201);
      const todoData = (await todoRes.json()) as Todo;
      todoIds.push(todoData.id);
    }
  });

  test("should bulk assign tag to todos", async () => {
    const res = await app.request(`${apiPath}/tags/${tagId}/bulk-assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tagIds: [tagId],
        todoIds,
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as BulkOperationResponse;
    expect(data.successCount).toBe(todoIds.length);
    expect(data.failedCount).toBe(0);

    // Verify tags were assigned
    for (const todoId of todoIds) {
      const getRes = await app.request(`${apiPath}/todos/${todoId}/tags`);
      expect(getRes.status).toBe(200);
      const tags = (await getRes.json()) as Tag[];
      expect(tags.find((tag) => tag.id === tagId)).toBeDefined();
    }
  });

  test("should get todos by tag", async () => {
    // 事前にタグを一括付与
    await app.request(`${apiPath}/tags/${tagId}/bulk-assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tagIds: [tagId],
        todoIds,
      }),
    });

    const res = await app.request(`${apiPath}/tags/${tagId}/todos`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Todo[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(todoIds.length);
    for (const todoId of todoIds) {
      expect(data.find((todo) => todo.id === todoId)).toBeDefined();
    }
  });

  test("should bulk remove tag from todos", async () => {
    // 事前にタグを一括付与
    await app.request(`${apiPath}/tags/${tagId}/bulk-assign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tagIds: [tagId],
        todoIds,
      }),
    });

    const res = await app.request(`${apiPath}/tags/${tagId}/bulk-remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tagIds: [tagId],
        todoIds,
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as BulkOperationResponse;
    expect(data.successCount).toBe(todoIds.length);
    expect(data.failedCount).toBe(0);

    // Verify tags were removed
    for (const todoId of todoIds) {
      const getRes = await app.request(`${apiPath}/todos/${todoId}/tags`);
      expect(getRes.status).toBe(200);
      const tags = (await getRes.json()) as Tag[];
      expect(tags.find((tag) => tag.id === tagId)).toBeUndefined();
    }
  });
});
