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

  test("should create a new project successfully", async () => {
    const projectData = {
      name: "Test Project",
      description: "Project for E2E test",
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

  test("should get the list of all projects", async () => {
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

    // Check that the created project is included
    const foundProject = responseData.find((project) => project.id === createdProjectId);
    expect(foundProject).toBeDefined();
  });

  test("should get a project by ID", async () => {
    const response = await app.request(`${apiBase}/projects/${createdProjectId}`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Project;
    expect(responseData).toHaveProperty("id", createdProjectId);
    expect(responseData).toHaveProperty("name", "Test Project");
  });

  test("should return 404 when accessing a non-existent project", async () => {
    const nonExistentId = "00000000-0000-0000-0000-000000000000";
    const response = await app.request(`${apiBase}/projects/${nonExistentId}`);

    expect(response.status).toBe(404);
  });

  test("should update a project successfully", async () => {
    const updateData = {
      name: "Updated project name",
      description: "Updated description",
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

  test("should add a todo to a project", async () => {
    // First, create a todo
    const todoData = {
      title: "Todo for project",
      description: "This todo is for adding to a project.",
    };

    const todoResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify(todoData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(todoResponse.status).toBe(201);
    const todoResponseData = (await todoResponse.json()) as Todo;
    createdTodoId = todoResponseData.id;

    // Add todo to project
    const addTodoResponse = await app.request(`${apiBase}/projects/${createdProjectId}/todos`, {
      method: "POST",
      body: JSON.stringify({ todoId: createdTodoId }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(addTodoResponse.status).toBe(201);
  });

  test("should get the list of todos in a project", async () => {
    const response = await app.request(`${apiBase}/projects/${createdProjectId}/todos`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as Todo[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    // Check that the added todo is included
    const foundTodo = responseData.find((todo) => todo.id === createdTodoId);
    expect(foundTodo).toBeDefined();
  });

  test("should remove a todo from a project", async () => {
    const response = await app.request(`${apiBase}/projects/${createdProjectId}/todos/${createdTodoId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    // Check that the removed todo is not in the project
    const checkResponse = await app.request(`${apiBase}/projects/${createdProjectId}/todos`);
    const checkData = (await checkResponse.json()) as Todo[];

    const foundTodo = checkData.find((todo) => todo.id === createdTodoId);
    expect(foundTodo).toBeUndefined();
  });

  test("should delete a project successfully", async () => {
    const deleteResponse = await app.request(`${apiBase}/projects/${createdProjectId}`, {
      method: "DELETE",
    });
    expect(deleteResponse.status).toBe(204);

    // Check that 404 is returned after deletion
    const getResponse = await app.request(`${apiBase}/projects/${createdProjectId}`);
    expect(getResponse.status).toBe(404);
  });
});
