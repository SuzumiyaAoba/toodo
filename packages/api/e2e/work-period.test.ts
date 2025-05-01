import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { setupTestDatabase, teardownTestDatabase } from "./setup";
import type { Todo, TodoActivity, WorkPeriod } from "./types";

describe("Work Period API", () => {
  const apiPath = "/api/v1";
  let workPeriodId: string;
  let todoId: string;
  let activityId: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test("should create a work period", async () => {
    const res = await app.request(`${apiPath}/work-periods`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Work Period",
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
      }),
    });

    expect(res.status).toBe(201);
    const data = (await res.json()) as WorkPeriod;
    expect(data.name).toBe("Test Work Period");
    workPeriodId = data.id;
  });

  test("should create a todo and add an activity", async () => {
    // Create todo
    const todoRes = await app.request(`${apiPath}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Work Period Todo",
        description: "This is a todo for work period testing",
      }),
    });

    expect(todoRes.status).toBe(201);
    const todoData = (await todoRes.json()) as Todo;
    todoId = todoData.id;

    // Add activity
    const activityRes = await app.request(`${apiPath}/todos/${todoId}/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "started",
        note: "Starting work in test period",
      }),
    });

    expect(activityRes.status).toBe(201);
    const activityData = (await activityRes.json()) as TodoActivity;
    activityId = activityData.id;
  });

  test("should assign activity to work period", async () => {
    const res = await app.request(`${apiPath}/work-periods/${workPeriodId}/activities/${activityId}`, {
      method: "POST",
    });

    expect(res.status).toBe(201);

    // Verify activity was assigned
    const getRes = await app.request(`${apiPath}/work-periods/${workPeriodId}`);
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as WorkPeriod;
    expect(data.activities.find((activity) => activity.id === activityId)).toBeDefined();
  });

  test("should get work period activities", async () => {
    const res = await app.request(`${apiPath}/work-periods/${workPeriodId}/activities`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as TodoActivity[];
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]?.id).toBe(activityId);
  });

  test("should update a work period", async () => {
    const res = await app.request(`${apiPath}/work-periods/${workPeriodId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Updated Work Period",
        endTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours later
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as WorkPeriod;
    expect(data.name).toBe("Updated Work Period");
  });

  test("should remove activity from work period", async () => {
    const res = await app.request(`${apiPath}/work-periods/${workPeriodId}/activities/${activityId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    // Verify activity was removed
    const getRes = await app.request(`${apiPath}/work-periods/${workPeriodId}`);
    expect(getRes.status).toBe(200);
    const data = (await getRes.json()) as WorkPeriod;
    expect(data.activities.find((activity) => activity.id === activityId)).toBeUndefined();
  });

  test("should delete a work period", async () => {
    const res = await app.request(`${apiPath}/work-periods/${workPeriodId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(204);

    // Verify work period was deleted
    const getRes = await app.request(`${apiPath}/work-periods/${workPeriodId}`);
    expect(getRes.status).toBe(404);
  });
});
