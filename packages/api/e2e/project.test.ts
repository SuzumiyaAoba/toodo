import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Project, Todo } from "./types";

describe("Project API", () => {
  const apiPath = "/api/v1";
  let createdProjectId: string;
  let createdTodoId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a new project", async () => {
    const res = await app.request(`${apiPath}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Project",
        description: "This is a test project",
        color: "#FF0000",
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as Project;
    expect(data.name).toBe("Test Project");
    expect(data.description).toBe("This is a test project");
    expect(data.color).toBe("#FF0000");
    expect(data.status).toBe("active");

    createdProjectId = data.id;
  });

  test("should get the list of projects", async () => {
    const res = await app.request(`${apiPath}/projects`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Project[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  test("should get a specific project", async () => {
    const res = await app.request(`${apiPath}/projects/${createdProjectId}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as Project;
    expect(data.id).toBe(createdProjectId);
    expect(data.name).toBe("Test Project");
  });

  test("should update a project", async () => {
    const res = await app.request(`${apiPath}/projects/${createdProjectId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Project",
        description: "This is an updated project",
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as Project;
    expect(data.name).toBe("Updated Project");
    expect(data.description).toBe("This is an updated project");
  });

  test("should create a todo and add it to the project", async () => {
    // Create a todo
    const todoRes = await app.request(`${apiPath}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Project Todo",
        description: "This is a todo for the project",
      }),
    });

    expect(todoRes.status).toBe(201);
    const todoData = (await todoRes.json()) as Todo;
    createdTodoId = todoData.id;

    // Add todo to project
    const res = await app.request(`${apiPath}/projects/${createdProjectId}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        todoId: createdTodoId,
      }),
    });

    expect(res.status).toBe(201);
  });

  test("should get todos in a project", async () => {
    const res = await app.request(`${apiPath}/projects/${createdProjectId}/todos`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { project: any; todos: any[] };
    expect(data.todos).toBeDefined();
    expect(Array.isArray(data.todos)).toBe(true);
  });

  test("should remove a todo from a project", async () => {
    const res = await app.request(`${apiPath}/projects/${createdProjectId}/todos/${createdTodoId}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);

    // Verify that the todo is removed from the project
    const getRes = await app.request(`${apiPath}/projects/${createdProjectId}/todos`);
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as { project: any; todos: any[] };
    expect(data.todos.find((todo) => todo.id === createdTodoId)).toBeUndefined();
  });

  test("should delete a project", async () => {
    const res = await app.request(`${apiPath}/projects/${createdProjectId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    // Verify that the project is deleted
    const getRes = await app.request(`${apiPath}/projects/${createdProjectId}`);
    expect(getRes.status).toBe(404);
  });
});
