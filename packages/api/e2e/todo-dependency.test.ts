import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { setupTestDatabase, teardownTestDatabase } from "./setup";
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

describe("Todo Dependency API", () => {
  const apiPath = "/api/v1";
  let todoId: string;
  let dependencyId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create todos for dependency testing", async () => {
    // Create first todo
    const res1 = await app.request(`${apiPath}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Main Todo",
        description: "This is the main todo",
      }),
    });

    expect(res1.status).toBe(201);
    const data1 = (await res1.json()) as Todo;
    todoId = data1.id;

    // Create second todo (dependency)
    const res2 = await app.request(`${apiPath}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Dependency Todo",
        description: "This todo is a dependency",
      }),
    });

    expect(res2.status).toBe(201);
    const data2 = (await res2.json()) as Todo;
    dependencyId = data2.id;
  });

  test("should add a dependency to a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${todoId}/dependencies/${dependencyId}`, {
      method: "POST",
    });

    expect(res.status).toBe(201);

    // Verify the dependency was added
    const getRes = await app.request(`${apiPath}/todos/${todoId}`);
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as { todo: Todo };
    expect(data.todo.dependencies).toContain(dependencyId);
  });

  test("should get dependencies of a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${todoId}/dependencies`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Todo[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]?.id).toBe(dependencyId);
  });

  test("should get dependents of a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${dependencyId}/dependents`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Todo[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]?.id).toBe(todoId);
  });

  test("should remove a dependency from a todo", async () => {
    const res = await app.request(`${apiPath}/todos/${todoId}/dependencies/${dependencyId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    // Verify the dependency was removed
    const getRes = await app.request(`${apiPath}/todos/${todoId}`);
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as { todo: Todo };
    expect(data.todo.dependencies).not.toContain(dependencyId);
  });

  test("should not allow circular dependencies", async () => {
    // Try to create a circular dependency
    const res = await app.request(`${apiPath}/todos/${dependencyId}/dependencies/${todoId}`, {
      method: "POST",
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
