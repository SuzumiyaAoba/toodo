import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { prisma, setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Project, Todo } from "./types";

describe("Project API E2E Tests", () => {
  const apiBase = "/api/v1";
  let createdProjectId: string;
  let createdTodoId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("プロジェクトの新規作成が正常に行えること", async () => {
    const projectData = {
      name: "テストプロジェクト",
      description: "E2Eテスト用のプロジェクト",
      color: "#4287f5",
    };

    const response = await app.request(`${apiBase}/projects`, {
      method: "POST",
      body: JSON.stringify(projectData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(201);
    const responseData = (await response.json()) as {
      id: string;
      name: string;
      description: string;
      color: string;
    };
    expect(responseData).toHaveProperty("id");
    expect(responseData.name).toBe(projectData.name);
    expect(responseData.description).toBe(projectData.description);
    expect(responseData.color).toBe(projectData.color);

    createdProjectId = responseData.id;
  });

  test("プロジェクト一覧が取得できること", async () => {
    const response = await app.request(`${apiBase}/projects`);
    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Array<{
      id: string;
      name: string;
      description: string;
      color: string;
    }>;
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // 作成したプロジェクトが含まれていることを確認
    const foundProject = responseData.find((project) => project.id === createdProjectId);
    expect(foundProject).toBeDefined();
  });

  test("IDでプロジェクトを取得できること", async () => {
    const response = await app.request(`${apiBase}/projects/${createdProjectId}`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Project;
    expect(responseData).toHaveProperty("id", createdProjectId);
    expect(responseData).toHaveProperty("name", "テストプロジェクト");
  });

  test("存在しないプロジェクトへのアクセスで404が返ること", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const response = await app.request(`${apiBase}/projects/${nonExistentId}`);

    expect(response.status).toBe(404);
  });

  test("プロジェクトの更新が正常に行えること", async () => {
    const updateData = {
      name: "更新されたプロジェクト名",
      description: "更新された説明",
      color: "#f54242",
    };

    const response = await app.request(`${apiBase}/projects/${createdProjectId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Project;
    expect(responseData).toHaveProperty("name", updateData.name);
    expect(responseData).toHaveProperty("description", updateData.description);
    expect(responseData).toHaveProperty("color", updateData.color);
  });

  test("プロジェクトにTodoを追加できること", async () => {
    // まずTodoを作成
    const todoData = {
      title: "プロジェクト用Todo",
      description: "このTodoはプロジェクトに追加するためのものです",
    };

    const todoResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(todoResponse.status).toBe(201);
    const todoResponseData = (await todoResponse.json()) as Todo;
    createdTodoId = todoResponseData.id;

    // Todoをプロジェクトに追加
    const addTodoResponse = await app.request(`${apiBase}/projects/${createdProjectId}/todos`, {
      method: "POST",
      body: JSON.stringify({ todoId: createdTodoId }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(addTodoResponse.status).toBe(201);
  });

  test("プロジェクト内のTodo一覧が取得できること", async () => {
    const response = await app.request(`${apiBase}/projects/${createdProjectId}/todos`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // 追加したTodoが含まれていることを確認
    const foundTodo = responseData.find((todo) => todo.id === createdTodoId);
    expect(foundTodo).toBeDefined();
  });

  test("プロジェクトからTodoを削除できること", async () => {
    const response = await app.request(`${apiBase}/projects/${createdProjectId}/todos/${createdTodoId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    // 削除後にプロジェクト内のTodoを検索
    const checkResponse = await app.request(`${apiBase}/projects/${createdProjectId}/todos`);
    const checkData = (await checkResponse.json()) as Todo[];

    // 削除したTodoがないことを確認
    const foundTodo = checkData.find((todo) => todo.id === createdTodoId);
    expect(foundTodo).toBeUndefined();
  });

  test("プロジェクトの削除が正常に行えること", async () => {
    const deleteResponse = await app.request(`${apiBase}/projects/${createdProjectId}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    // 削除後にアクセスして404が返ることを確認
    const getResponse = await app.request(`${apiBase}/projects/${createdProjectId}`);
    expect(getResponse.status).toBe(404);
  });
});
