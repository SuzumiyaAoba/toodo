import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { prisma, setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Todo, TodoActivity } from "./types";

interface WorkPeriod {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

describe("Work Period API E2E Tests", () => {
  const apiBase = "/api/v1";
  let workPeriodId: string;
  let todoId: string;
  let activityId: string;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create a todo for testing
    const todoResponse = await app.request(`${apiBase}/todos`, {
      method: "POST",
      body: JSON.stringify({
        title: "Todo for work period test",
        description: "This todo is used for work period testing",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const todoData = (await todoResponse.json()) as Todo;
    todoId = todoData.id;

    // Create an activity for the todo
    const activityResponse = await app.request(`${apiBase}/todos/${todoId}/activities`, {
      method: "POST",
      body: JSON.stringify({
        type: "started",
        note: "Starting work in work period test",
      }),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    const activityData = (await activityResponse.json()) as TodoActivity;
    activityId = activityData.id;
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a work period successfully", async () => {
    const now = new Date();
    const later = new Date(now.getTime() + 3600000); // 1 hour later

    const workPeriodData = {
      name: "Morning Work Session",
      startTime: now.toISOString(),
      endTime: later.toISOString(),
    };

    const response = await app.request(`${apiBase}/work-periods`, {
      method: "POST",
      body: JSON.stringify(workPeriodData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(201);
    const responseData = (await response.json()) as WorkPeriod;
    expect(responseData).toHaveProperty("id");
    expect(responseData.name).toBe(workPeriodData.name);
    expect(new Date(responseData.startTime).toISOString()).toBe(workPeriodData.startTime);
    expect(new Date(responseData.endTime).toISOString()).toBe(workPeriodData.endTime);

    workPeriodId = responseData.id;
  });

  test("should get all work periods", async () => {
    const response = await app.request(`${apiBase}/work-periods`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as WorkPeriod[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);

    const foundPeriod = responseData.find((period) => period.id === workPeriodId);
    expect(foundPeriod).toBeDefined();
  });

  test("should get a work period by ID", async () => {
    const response = await app.request(`${apiBase}/work-periods/${workPeriodId}`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as WorkPeriod;
    expect(responseData).toHaveProperty("id", workPeriodId);
    expect(responseData).toHaveProperty("name", "Morning Work Session");
  });

  test("should update a work period", async () => {
    const now = new Date();
    const later = new Date(now.getTime() + 7200000); // 2 hours later

    const updateData = {
      name: "Updated Work Session",
      startTime: now.toISOString(),
      endTime: later.toISOString(),
    };

    const response = await app.request(`${apiBase}/work-periods/${workPeriodId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as WorkPeriod;
    expect(responseData.name).toBe(updateData.name);
    expect(new Date(responseData.startTime).toISOString()).toBe(updateData.startTime);
    expect(new Date(responseData.endTime).toISOString()).toBe(updateData.endTime);
  });

  test("should associate a todo activity with a work period", async () => {
    const response = await app.request(`${apiBase}/work-periods/${workPeriodId}/activities/${activityId}`, {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
    });

    expect(response.status).toBe(204);

    // Verify the association
    const checkResponse = await app.request(`${apiBase}/work-periods/${workPeriodId}/activities`);
    expect(checkResponse.status).toBe(200);
    const activities = (await checkResponse.json()) as TodoActivity[];
    expect(activities.some((activity) => activity.id === activityId)).toBe(true);
  });

  test("should get activities in a work period", async () => {
    const response = await app.request(`${apiBase}/work-periods/${workPeriodId}/activities`);

    expect(response.status).toBe(200);
    const responseData = (await response.json()) as TodoActivity[];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBeGreaterThan(0);
    expect(responseData.some((activity) => activity.id === activityId)).toBe(true);
  });

  test("should remove an activity from a work period", async () => {
    const response = await app.request(`${apiBase}/work-periods/${workPeriodId}/activities/${activityId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    // Verify the activity was removed
    const checkResponse = await app.request(`${apiBase}/work-periods/${workPeriodId}/activities`);
    const activities = (await checkResponse.json()) as TodoActivity[];
    expect(activities.some((activity) => activity.id === activityId)).toBe(false);
  });

  test("should delete a work period", async () => {
    const response = await app.request(`${apiBase}/work-periods/${workPeriodId}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    // Verify the work period was deleted
    const checkResponse = await app.request(`${apiBase}/work-periods/${workPeriodId}`);
    expect(checkResponse.status).toBe(404);
  });
});
