import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { prisma, setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Todo } from "./types";

// 依存関係リストのレスポンス型を定義
interface TodoDependencyListResponse {
  dependencies: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
}

// 被依存関係リストのレスポンス型を定義
interface TodoDependentListResponse {
  dependents: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
}

// 依存関係ツリーのレスポンス型を定義
interface TodoDependencyTreeResponse {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  dependencies: TodoDependencyTreeResponse[];
}

// エラーレスポンスの型を定義
interface ErrorResponse {
  error: string;
}

describe("Todo Dependency API E2E Tests", () => {
  const apiBase = "/api/v1";
  let parentTodoId: string;
  let dependencyTodoId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("依存元となるTodoの新規作成が正常に行えること", async () => {
    const todoData = {
      title: "親タスク",
      description: "このタスクは他のタスクに依存します",
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

    parentTodoId = responseData.id;
  });

  test("依存先となるTodoの新規作成が正常に行えること", async () => {
    const todoData = {
      title: "依存先タスク",
      description: "このタスクは他のタスクから依存されます",
      priority: "medium",
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

    dependencyTodoId = responseData.id;
  });

  test("Todo間の依存関係を追加できること", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(204);
  });

  test("同じ依存関係を重複して追加しようとするとエラーになること", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as ErrorResponse;
    expect(responseData).toHaveProperty("error");
  });

  test("自己参照の依存関係を追加しようとするとエラーになること", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${parentTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as ErrorResponse;
    expect(responseData).toHaveProperty("error");
  });

  test("循環依存を作成しようとするとエラーになること", async () => {
    // まず逆方向の依存関係を作ろうとする
    const response = await app.request(`${apiBase}/todos/${dependencyTodoId}/dependencies/${parentTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as ErrorResponse;
    expect(responseData).toHaveProperty("error");
  });

  test("Todoの依存関係リストを取得できること", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as TodoDependencyListResponse;
    expect(responseData).toHaveProperty("dependencies");

    if (responseData?.dependencies) {
      expect(Array.isArray(responseData.dependencies)).toBe(true);
      expect(responseData.dependencies.length).toBe(1);
      expect(responseData.dependencies[0]?.id).toBe(dependencyTodoId);
    }
  });

  test("Todoの被依存関係（依存元）リストを取得できること", async () => {
    const response = await app.request(`${apiBase}/todos/${dependencyTodoId}/dependents`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as TodoDependentListResponse;
    expect(responseData).toHaveProperty("dependents");

    if (responseData?.dependents) {
      expect(Array.isArray(responseData.dependents)).toBe(true);
      expect(responseData.dependents.length).toBe(1);
      expect(responseData.dependents[0]?.id).toBe(parentTodoId);
    }
  });

  test("依存関係ツリーを取得できること", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependency-tree`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as TodoDependencyTreeResponse;
    expect(responseData).toHaveProperty("id", parentTodoId);
    expect(responseData).toHaveProperty("dependencies");

    if (responseData?.dependencies) {
      expect(Array.isArray(responseData.dependencies)).toBe(true);
      expect(responseData.dependencies.length).toBe(1);
      expect(responseData.dependencies[0]?.id).toBe(dependencyTodoId);
    }
  });

  test("依存関係を削除できること", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    // 依存関係が実際に削除されたことを確認
    const checkResponse = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies`);
    expect(checkResponse.status).toBe(200);
    const checkData = (await checkResponse.json()) as TodoDependencyListResponse;

    if (checkData?.dependencies) {
      expect(checkData.dependencies.length).toBe(0);
    }
  });

  test("存在しない依存関係を削除しようとするとエラーになること", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as ErrorResponse;
    expect(responseData).toHaveProperty("error");
  });

  test("Todoを削除すると関連する依存関係も削除されること", async () => {
    // まず依存関係を再作成
    await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    // 親Todoを削除
    const deleteResponse = await app.request(`${apiBase}/todos/${parentTodoId}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    // 子Todoからの被依存関係リストが空になることを確認
    const dependentsResponse = await app.request(`${apiBase}/todos/${dependencyTodoId}/dependents`);
    expect(dependentsResponse.status).toBe(200);
    const dependentsData = (await dependentsResponse.json()) as TodoDependentListResponse;

    if (dependentsData?.dependents) {
      expect(dependentsData.dependents.length).toBe(0);
    }
  });
});
