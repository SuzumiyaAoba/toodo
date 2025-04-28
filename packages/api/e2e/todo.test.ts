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

  test("Todoの新規作成が正常に行えること", async () => {
    const todoData = {
      title: "E2Eテスト用Todo",
      description: "E2Eテストの検証に使用するTodoです",
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
    expect(responseData.description).toBe(todoData.description);
    expect(responseData.priority).toBe(todoData.priority);
    expect(responseData.status).toBe("pending");
    expect(responseData.workState).toBe("idle");

    createdTodoId = responseData.id;
  });

  test("全Todoのリストが取得できること", async () => {
    const response = await app.request(`${apiBase}/todos`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // 作成したTodoが含まれていることを確認
    const foundTodo = responseData.find((todo) => todo.id === createdTodoId);
    expect(foundTodo).toBeDefined();
  });

  test("IDでTodoを取得できること", async () => {
    const response = await app.request(`${apiBase}/todos/${createdTodoId}`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo;
    expect(responseData).toHaveProperty("id", createdTodoId);
    expect(responseData).toHaveProperty("title", "E2Eテスト用Todo");
  });

  test("存在しないTodoへのアクセスで404が返ること", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const response = await app.request(`${apiBase}/todos/${nonExistentId}`);

    expect(response.status).toBe(404);
  });

  test("Todoの更新が正常に行えること", async () => {
    const updateData = {
      title: "更新されたTodoタイトル",
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
    // 更新していない項目は保持されていることを確認
    expect(responseData).toHaveProperty("description", "E2Eテストの検証に使用するTodoです");
  });

  test("Todoアクティビティの追加と取得が行えること", async () => {
    // アクティビティを追加
    const activityData = {
      type: "started",
      note: "E2Eテストでの作業開始",
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

    // アクティビティのリストを取得
    const listResponse = await app.request(`${apiBase}/todos/${createdTodoId}/activities`);

    expect(listResponse.status).toBe(200);
    const listResponseData = (await listResponse.json()) as TodoActivity[];
    expect(Array.isArray(listResponseData)).toBe(true);
    expect(listResponseData.length).toBeGreaterThan(0);

    // 追加したアクティビティが含まれていることを確認
    const foundActivity = listResponseData.find(
      (activity) => activity.type === activityData.type && activity.note === activityData.note,
    );
    expect(foundActivity).toBeDefined();
  });

  test("Todoの作業時間が取得できること", async () => {
    // まず完了アクティビティを追加してwork timeを生成
    await app.request(`${apiBase}/todos/${createdTodoId}/activities`, {
      method: "POST",
      body: JSON.stringify({
        type: "completed",
        note: "E2Eテストでの作業完了",
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

  test("Todoの削除が正常に行えること", async () => {
    const deleteResponse = await app.request(`${apiBase}/todos/${createdTodoId}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    // 削除後にアクセスして404が返ることを確認
    const getResponse = await app.request(`${apiBase}/todos/${createdTodoId}`);
    expect(getResponse.status).toBe(404);
  });
});
