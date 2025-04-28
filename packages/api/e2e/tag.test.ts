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

    // テスト用のTodoを作成
    const todoResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify({
        title: "タグテスト用Todo",
        description: "タグのE2Eテストで使用するTodoです",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const todoData = (await todoResponse.json()) as Todo;
    createdTodoId = todoData.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("タグの新規作成が正常に行えること", async () => {
    const tagData = {
      name: "E2Eテスト用タグ",
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

  test("全タグのリストが取得できること", async () => {
    const response = await app.request(`${apiBase}/tags`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Tag[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // 作成したタグが含まれていることを確認
    const foundTag = responseData.find((tag) => tag.id === createdTagId);
    expect(foundTag).toBeDefined();
  });

  test("IDでタグを取得できること", async () => {
    const response = await app.request(`${apiBase}/tags/${createdTagId}`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Tag;
    expect(responseData).toHaveProperty("id", createdTagId);
    expect(responseData).toHaveProperty("name", "E2Eテスト用タグ");
  });

  test("存在しないタグへのアクセスで404が返ること", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const response = await app.request(`${apiBase}/tags/${nonExistentId}`);

    expect(response.status).toBe(404);
  });

  test("タグの更新が正常に行えること", async () => {
    const updateData = {
      name: "更新されたタグ名",
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

  test("Todoにタグを付与できること", async () => {
    const response = await app.request(`${apiBase}/todos/${createdTodoId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tagId: createdTagId }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(201);
  });

  test("タグでTodoを検索できること", async () => {
    const response = await app.request(`${apiBase}/tags/${createdTagId}/todos`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // 作成したTodoが含まれていることを確認
    const foundTodo = responseData.find((todo) => todo.id === createdTodoId);
    expect(foundTodo).toBeDefined();
  });

  test("Todoからタグを削除できること", async () => {
    const response = await app.request(`${apiBase}/todos/${createdTodoId}/tags/${createdTagId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);
  });

  test("タグの削除が正常に行えること", async () => {
    const deleteResponse = await app.request(`${apiBase}/tags/${createdTagId}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    // 削除後にアクセスして404が返ることを確認
    const getResponse = await app.request(`${apiBase}/tags/${createdTagId}`);
    expect(getResponse.status).toBe(404);
  });
});
