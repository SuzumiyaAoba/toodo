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

  test("should create a parent todo successfully", async () => {
    const todoData = {
      title: "Parent Task",
      description: "This task depends on another task.",
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

  test("should create a dependency todo successfully", async () => {
    const todoData = {
      title: "Dependency Task",
      description: "This task is depended on by another task.",
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

  test("should add a dependency between todos", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(204);
  });

  test("should return error when adding the same dependency twice", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as ErrorResponse;
    expect(responseData).toHaveProperty("error");
  });

  test("should return error when adding a self-dependency", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${parentTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as ErrorResponse;
    expect(responseData).toHaveProperty("error");
  });

  test("should return error when creating a circular dependency", async () => {
    // Try to create a dependency in the reverse direction
    const response = await app.request(`${apiBase}/todos/${dependencyTodoId}/dependencies/${parentTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as ErrorResponse;
    expect(responseData).toHaveProperty("error");
  });

  test("should get the list of dependencies for a todo", async () => {
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

  test("should get the list of dependents for a todo", async () => {
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

  test("should get the dependency tree for a todo", async () => {
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

  test("should remove a dependency", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    // Check that the dependency was actually removed
    const checkResponse = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies`);
    expect(checkResponse.status).toBe(200);
    const checkData = (await checkResponse.json()) as TodoDependencyListResponse;

    if (checkData?.dependencies) {
      expect(checkData.dependencies.length).toBe(0);
    }
  });

  test("should return error when removing a non-existent dependency", async () => {
    const response = await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(400);
    const responseData = (await response.json()) as ErrorResponse;
    expect(responseData).toHaveProperty("error");
  });

  test("should remove related dependencies when a todo is deleted", async () => {
    // Re-create the dependency first
    await app.request(`${apiBase}/todos/${parentTodoId}/dependencies/${dependencyTodoId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    // Delete the parent todo
    const deleteResponse = await app.request(`${apiBase}/todos/${parentTodoId}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    // Check that the dependents list for the child todo is empty
    const dependentsResponse = await app.request(`${apiBase}/todos/${dependencyTodoId}/dependents`);
    expect(dependentsResponse.status).toBe(200);
    const dependentsData = (await dependentsResponse.json()) as TodoDependentListResponse;

    if (dependentsData?.dependents) {
      expect(dependentsData.dependents.length).toBe(0);
    }
  });
});
