import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { PrismaClient, type TodoActivity } from "./generated/prisma";
import type { TodoActivityList } from "./schema";

// Create a Prisma Client for testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./test.db",
    },
  },
});

// Create a Hono app for testing
const app = new Hono();

// Helper function to format work time
function formatWorkTime(seconds: number) {
  if (seconds === 0) {
    return "0 seconds";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
  }

  if (remainingSeconds > 0) {
    parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`);
  }

  return parts.join(", ");
}

// Create a TODO
app.post("/todos", async (c) => {
  const { title, description, status } = await c.req.json();
  const todo = await prisma.todo.create({
    data: { title, description, status },
  });
  return c.json(todo, 201);
});

// Get TODO list
app.get("/todos", async (c) => {
  const todos = await prisma.todo.findMany();
  return c.json(todos);
});

// Get TODO details
app.get("/todos/:id", async (c) => {
  const id = c.req.param("id");
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) return c.json({ error: "Todo not found" }, 404);
  return c.json(todo);
});

// Update a TODO
app.put("/todos/:id", async (c) => {
  const id = c.req.param("id");
  const updateData = await c.req.json();

  // Fetch the existing TODO
  const existingTodo = await prisma.todo.findUnique({ where: { id } });
  if (!existingTodo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  // Update only the fields specified in the request
  try {
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        // Only update fields that are not undefined
        ...(updateData.title !== undefined && { title: updateData.title }),
        ...(updateData.description !== undefined && { description: updateData.description }),
        ...(updateData.status !== undefined && { status: updateData.status }),
      },
    });
    return c.json(todo);
  } catch (error) {
    return c.json({ error: "Todo not found" }, 404);
  }
});

// Delete a TODO
app.delete("/todos/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await prisma.todo.delete({ where: { id } });
    c.status(204);
    return c.body(null);
  } catch (error) {
    return c.json({ error: "Todo not found" }, 404);
  }
});

// Record a TODO activity
app.post("/todos/:id/activities", async (c) => {
  const id = c.req.param("id");
  const { type, note } = await c.req.json();

  // Check if the TODO exists
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  // Calculate work time if applicable
  let workTime = null;
  const previousState = todo.workState;
  let newWorkState = todo.workState;

  // Calculate work time based on activity type and current state
  if (type === "started") {
    // Cannot start if already active or completed
    if (todo.workState === "active") {
      return c.json({ error: "Invalid state transition. TODO is already active" }, 400);
    }
    if (todo.workState === "completed") {
      return c.json({ error: "Invalid state transition. Cannot start a completed TODO" }, 400);
    }
    newWorkState = "active";
    workTime = 0; // Starting the work, so no time yet
  } else if (type === "paused") {
    // Can only pause if active
    if (todo.workState !== "active") {
      return c.json({ error: "Invalid state transition. Can only pause an active TODO" }, 400);
    }
    newWorkState = "paused";

    // Calculate the elapsed time since the last state change
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - todo.lastStateChangeAt.getTime()) / 1000);
    workTime = elapsedSeconds;
  } else if (type === "completed") {
    // Can mark as completed from any state except already completed
    if (todo.workState === "completed") {
      return c.json({ error: "Invalid state transition. TODO is already completed" }, 400);
    }
    newWorkState = "completed";

    // If active, calculate the elapsed time
    if (todo.workState === "active") {
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - todo.lastStateChangeAt.getTime()) / 1000);
      workTime = elapsedSeconds;
    } else {
      workTime = 0; // No additional time if not active
    }
  } else if (type === "discarded") {
    // Record the work time if active at time of discard
    if (todo.workState === "active") {
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - todo.lastStateChangeAt.getTime()) / 1000);
      workTime = elapsedSeconds;
    }
  }

  // Update the total work time for the TODO
  let totalWorkTime = todo.totalWorkTime;
  if (workTime && ["paused", "completed"].includes(type)) {
    totalWorkTime += workTime;
  }

  // Create the activity record
  const activity = await prisma.todoActivity.create({
    data: {
      todoId: id,
      type,
      workTime,
      previousState,
      note,
    },
  });

  // Update the TODO status and work state
  await prisma.todo.update({
    where: { id },
    data: {
      status: type === "completed" ? "completed" : todo.status,
      workState: newWorkState,
      totalWorkTime,
      lastStateChangeAt: new Date(),
    },
  });

  return c.json(activity, 201);
});

// Get TODO activity history
app.get("/todos/:id/activities", async (c) => {
  const id = c.req.param("id");

  // Check if the TODO exists
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  // Get the activity history
  const activities = await prisma.todoActivity.findMany({
    where: { todoId: id },
    orderBy: { createdAt: "desc" },
  });

  return c.json(activities);
});

// Get TODO work time
app.get("/todos/:id/work-time", async (c) => {
  const id = c.req.param("id");

  // Check if the TODO exists
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  // Format the work time in a human-readable format
  const formattedTime = formatWorkTime(todo.totalWorkTime);

  return c.json({
    id: todo.id,
    totalWorkTime: todo.totalWorkTime,
    workState: todo.workState,
    formattedTime,
  });
});

// Delete a TODO activity
app.delete("/todos/:id/activities/:activityId", async (c) => {
  const id = c.req.param("id");
  const activityId = c.req.param("activityId");

  // 1. Check if the TODO exists
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  // 2. Check if the activity exists and belongs to the TODO
  const activity: TodoActivity | null = await prisma.todoActivity.findUnique({
    where: { id: activityId },
  });

  if (!activity) {
    return c.json({ error: "Activity not found" }, 404);
  }

  // todoIdとidを比較する前に同じ型に変換
  if (activity.todoId !== id) {
    return c.json({ error: "Activity does not belong to this TODO" }, 403);
  }

  // 3. Check if deleting this activity would affect work time calculations
  // Cannot delete activities that have work time recorded or affect state transitions
  if (activity.workTime && activity.workTime > 0) {
    return c.json(
      {
        error: "Cannot delete this activity as it would affect the work time calculations",
      },
      403,
    );
  }

  // 4. If it's a state-changing activity (started, paused, completed),
  // check if it's the most recent activity of its type
  if (["started", "paused", "completed"].includes(activity.type)) {
    const latestStateActivity = await prisma.todoActivity.findFirst({
      where: {
        todoId: id,
        type: activity.type,
      },
      orderBy: { createdAt: "desc" },
    });

    // If it's the most recent activity of its type, don't allow deletion
    if (latestStateActivity && latestStateActivity.id === activityId) {
      return c.json(
        {
          error: "Cannot delete the most recent state-changing activity",
        },
        403,
      );
    }
  }

  // 5. If all validations pass, delete the activity
  await prisma.todoActivity.delete({ where: { id: activityId } });

  c.status(204);
  return c.body(null);
});

beforeAll(async () => {
  // Set up the test database
  const { execSync } = await import("node:child_process");
  execSync('DATABASE_URL="file:./test.db" npx prisma migrate dev --name test-setup --skip-generate', {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
});

beforeEach(async () => {
  // Clear data before each test
  await prisma.todo.deleteMany({});
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("TODO API", () => {
  it("can create a TODO", async () => {
    const response = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Test TODO",
        description: "This is a test TODO",
        status: "pending",
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("Test TODO");
    expect(data.description).toBe("This is a test TODO");
    expect(data.status).toBe("pending");
  });

  it("can get the TODO list", async () => {
    const response = await app.request("/todos", {
      method: "GET",
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it("can get TODO details", async () => {
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Detail Test",
        description: "Detail Test Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "GET",
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Detail Test");
    expect(data.description).toBe("Detail Test Description");
  });

  it("can update a TODO", async () => {
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Update Test",
        description: "Update Test Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: "Updated Title",
        description: "Updated Description",
        status: "completed",
      }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.title).toBe("Updated Title");
    expect(data.description).toBe("Updated Description");
    expect(data.status).toBe("completed");
  });

  it("can delete a TODO", async () => {
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Delete Test",
        description: "Delete Test Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "DELETE",
    });

    expect(response.status).toBe(204);

    const getResponse = await app.request(`/todos/${createdTodo.id}`, {
      method: "GET",
    });
    expect(getResponse.status).toBe(404);
  });

  it("can partially update a TODO - only title", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Partial Update Test",
        description: "Original Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Partially update only the title
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: "Updated Title Only",
      }),
    });
    const data = await response.json();

    // 3. Verify that only the title was updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Updated Title Only");
    expect(data.description).toBe("Original Description"); // Should remain unchanged
    expect(data.status).toBe("pending"); // Should remain unchanged
  });

  it("can partially update a TODO - only status", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Status Update Test",
        description: "Status Test Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Partially update only the status
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        status: "completed",
      }),
    });
    const data = await response.json();

    // 3. Verify that only the status was updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Status Update Test"); // Should remain unchanged
    expect(data.description).toBe("Status Test Description"); // Should remain unchanged
    expect(data.status).toBe("completed"); // Should be updated
  });

  it("can partially update a TODO - only description", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Description Update Test",
        description: "Original Description Text",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Partially update only the description
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        description: "Updated Description Only",
      }),
    });
    const data = await response.json();

    // 3. Verify that only the description was updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Description Update Test"); // Should remain unchanged
    expect(data.description).toBe("Updated Description Only"); // Should be updated
    expect(data.status).toBe("pending"); // Should remain unchanged
  });

  it("can update multiple fields but not all fields", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Multiple Fields Test",
        description: "Original Multiple Fields Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Update title and status but not description
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: "Updated Multiple Fields",
        status: "completed",
      }),
    });
    const data = await response.json();

    // 3. Verify that only specified fields were updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Updated Multiple Fields"); // Should be updated
    expect(data.description).toBe("Original Multiple Fields Description"); // Should remain unchanged
    expect(data.status).toBe("completed"); // Should be updated
  });

  it("handles empty update objects gracefully", async () => {
    // 1. Create a new TODO
    const createResponse = await app.request("/todos", {
      method: "POST",
      body: JSON.stringify({
        title: "Empty Update Test",
        description: "Empty Update Description",
        status: "pending",
      }),
    });
    const createdTodo = await createResponse.json();

    // 2. Send an empty update object
    const response = await app.request(`/todos/${createdTodo.id}`, {
      method: "PUT",
      body: JSON.stringify({}),
    });
    const data = await response.json();

    // 3. Verify that no fields were updated
    expect(response.status).toBe(200);
    expect(data.title).toBe("Empty Update Test"); // Should remain unchanged
    expect(data.description).toBe("Empty Update Description"); // Should remain unchanged
    expect(data.status).toBe("pending"); // Should remain unchanged
  });

  // Work State and Time Tracking Tests
  describe("Work State and Time Tracking", () => {
    it("creates a new TODO with default work state and time", async () => {
      const response = await app.request("/todos", {
        method: "POST",
        body: JSON.stringify({
          title: "Work State Test",
          description: "Testing work state functionality",
          status: "pending",
        }),
      });
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.workState).toBe("idle");
      expect(data.totalWorkTime).toBe(0);
      expect(data.lastStateChangeAt).toBeDefined();
    });

    it("can record a start activity and update work state", async () => {
      // 1. Create a TODO
      const createResponse = await app.request("/todos", {
        method: "POST",
        body: JSON.stringify({
          title: "Start Activity Test",
          description: "Testing start activity",
          status: "pending",
        }),
      });
      const todo = await createResponse.json();

      // 2. Record a start activity
      const activityResponse = await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Starting work on this task",
        }),
      });
      const activity = await activityResponse.json();

      // 3. Get updated TODO details
      const todoResponse = await app.request(`/todos/${todo.id}`, {
        method: "GET",
      });
      const updatedTodo = await todoResponse.json();

      // 4. Verify activity and TODO state
      expect(activityResponse.status).toBe(201);
      expect(activity.type).toBe("started");
      expect(activity.previousState).toBe("idle");
      expect(activity.workTime).toBe(0);

      expect(updatedTodo.workState).toBe("active");
      expect(updatedTodo.totalWorkTime).toBe(0); // No work time accumulated yet
    });

    it("can pause an active TODO and track work time", async () => {
      // 1. Create a TODO
      const createResponse = await app.request("/todos", {
        method: "POST",
        body: JSON.stringify({
          title: "Pause Activity Test",
          description: "Testing pause activity",
          status: "pending",
        }),
      });
      const todo = await createResponse.json();

      // 2. Start the TODO
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Starting work",
        }),
      });

      // Wait a short time to accumulate some work time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Pause the TODO
      const pauseResponse = await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "paused",
          note: "Taking a break",
        }),
      });
      const pauseActivity = await pauseResponse.json();

      // 4. Get updated TODO details
      const todoResponse = await app.request(`/todos/${todo.id}`, {
        method: "GET",
      });
      const updatedTodo = await todoResponse.json();

      // 5. Verify activity and work time
      expect(pauseResponse.status).toBe(201);
      expect(pauseActivity.type).toBe("paused");
      expect(pauseActivity.previousState).toBe("active");
      expect(pauseActivity.workTime).toBeGreaterThan(0); // Should have some work time

      expect(updatedTodo.workState).toBe("paused");
      expect(updatedTodo.totalWorkTime).toBeGreaterThan(0); // Should have accumulated work time
    });

    it("can complete a TODO and finalize work time", async () => {
      // 1. Create a TODO
      const createResponse = await app.request("/todos", {
        method: "POST",
        body: JSON.stringify({
          title: "Complete Activity Test",
          description: "Testing complete activity",
          status: "pending",
        }),
      });
      const todo = await createResponse.json();

      // 2. Start the TODO
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Starting work",
        }),
      });

      // Wait a short time to accumulate some work time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. Complete the TODO
      const completeResponse = await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "completed",
          note: "Finished the task",
        }),
      });
      const completeActivity = await completeResponse.json();

      // 4. Get updated TODO details
      const todoResponse = await app.request(`/todos/${todo.id}`, {
        method: "GET",
      });
      const updatedTodo = await todoResponse.json();

      // 5. Verify activity, work time, and status
      expect(completeResponse.status).toBe(201);
      expect(completeActivity.type).toBe("completed");
      expect(completeActivity.previousState).toBe("active");
      expect(completeActivity.workTime).toBeGreaterThan(0);

      expect(updatedTodo.workState).toBe("completed");
      expect(updatedTodo.status).toBe("completed");
      expect(updatedTodo.totalWorkTime).toBeGreaterThan(0);
    });

    it("prevents invalid state transitions", async () => {
      // 1. Create a TODO
      const createResponse = await app.request("/todos", {
        method: "POST",
        body: JSON.stringify({
          title: "Invalid Transition Test",
          description: "Testing invalid transitions",
          status: "pending",
        }),
      });
      const todo = await createResponse.json();

      // 2. Start the TODO
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Starting work",
        }),
      });

      // 3. Try to start again (already active)
      const invalidStartResponse = await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Starting again",
        }),
      });

      // 4. Complete the TODO
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "completed",
          note: "Finishing work",
        }),
      });

      // 5. Try to start a completed TODO
      const startCompletedResponse = await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Trying to restart",
        }),
      });

      // 6. Verify error responses
      expect(invalidStartResponse.status).toBe(400);
      expect(startCompletedResponse.status).toBe(400);

      const invalidStartData = await invalidStartResponse.json();
      const startCompletedData = await startCompletedResponse.json();

      expect(invalidStartData.error).toContain("already active");
      expect(startCompletedData.error).toContain("Cannot start a completed TODO");
    });

    it("can get work time information", async () => {
      // 1. Create a TODO
      const createResponse = await app.request("/todos", {
        method: "POST",
        body: JSON.stringify({
          title: "Work Time Info Test",
          description: "Testing work time endpoint",
          status: "pending",
        }),
      });
      const todo = await createResponse.json();

      // 2. Start the TODO
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Starting work",
        }),
      });

      // Wait a short time to accumulate some work time
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 3. Pause the TODO
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "paused",
          note: "Taking a break",
        }),
      });

      // 4. Get work time information
      const workTimeResponse = await app.request(`/todos/${todo.id}/work-time`, {
        method: "GET",
      });
      const workTimeData = await workTimeResponse.json();

      // 5. Verify work time information
      expect(workTimeResponse.status).toBe(200);
      expect(workTimeData.id).toBe(todo.id);
      expect(workTimeData.totalWorkTime).toBeGreaterThan(0);
      expect(workTimeData.workState).toBe("paused");
      expect(workTimeData.formattedTime).toBeDefined();
      expect(typeof workTimeData.formattedTime).toBe("string");
      expect(workTimeData.formattedTime).toContain("second"); // Should at least have seconds
    });

    it("tracks cumulative work time across multiple work sessions", async () => {
      // 1. Create a TODO
      const createResponse = await app.request("/todos", {
        method: "POST",
        body: JSON.stringify({
          title: "Multiple Sessions Test",
          description: "Testing cumulative work time",
          status: "pending",
        }),
      });
      const todo = await createResponse.json();

      // 2. First work session
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Starting first session",
        }),
      });

      // Wait a short time for the first session
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 3. Pause after first session
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "paused",
          note: "Pausing first session",
        }),
      });

      // Get time after first session
      const firstSessionResponse = await app.request(`/todos/${todo.id}/work-time`, {
        method: "GET",
      });
      const firstSessionData = await firstSessionResponse.json();
      const firstSessionTime = firstSessionData.totalWorkTime;

      // 4. Second work session
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "started",
          note: "Starting second session",
        }),
      });

      // Wait a different time for the second session
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 5. Complete the TODO
      await app.request(`/todos/${todo.id}/activities`, {
        method: "POST",
        body: JSON.stringify({
          type: "completed",
          note: "Completing after second session",
        }),
      });

      // Get final time after both sessions
      const finalTimeResponse = await app.request(`/todos/${todo.id}/work-time`, {
        method: "GET",
      });
      const finalTimeData = await finalTimeResponse.json();
      const finalTime = finalTimeData.totalWorkTime;

      // 6. Verify cumulative work time
      expect(firstSessionTime).toBeGreaterThan(0);
      expect(finalTime).toBeGreaterThan(firstSessionTime);
      expect(finalTimeData.workState).toBe("completed");
    });

    // Activity Deletion Tests
    describe("Activity Deletion", () => {
      it("can delete a non-critical activity", async () => {
        // 1. Create a TODO
        const createResponse = await app.request("/todos", {
          method: "POST",
          body: JSON.stringify({
            title: "Delete Activity Test",
            description: "Testing activity deletion",
            status: "pending",
          }),
        });
        const todo = await createResponse.json();

        // 2. Add a note activity (not affecting work state)
        const noteActivityResponse = await app.request(`/todos/${todo.id}/activities`, {
          method: "POST",
          body: JSON.stringify({
            type: "discarded", // Using discarded type for a note that doesn't affect state
            note: "This is a note activity that can be deleted",
          }),
        });
        const noteActivity = await noteActivityResponse.json();

        // 3. Try to delete the note activity
        const deleteResponse = await app.request(`/todos/${todo.id}/activities/${noteActivity.id}`, {
          method: "DELETE",
        });

        // 4. Verify successful deletion
        expect(deleteResponse.status).toBe(204);

        // 5. Verify the activity is gone
        const activitiesResponse = await app.request(`/todos/${todo.id}/activities`, {
          method: "GET",
        });
        const activities: TodoActivityList = await activitiesResponse.json();

        // Should not find the deleted activity ID in the list
        const deletedActivityExists = activities.some((activity) => activity.id === noteActivity.id);
        expect(deletedActivityExists).toBe(false);
      });

      it("cannot delete an activity with work time recorded", async () => {
        // 1. Create a TODO
        const createResponse = await app.request("/todos", {
          method: "POST",
          body: JSON.stringify({
            title: "Work Time Activity Test",
            description: "Testing work time activity deletion",
            status: "pending",
          }),
        });
        const todo = await createResponse.json();

        // 2. Start the TODO
        await app.request(`/todos/${todo.id}/activities`, {
          method: "POST",
          body: JSON.stringify({
            type: "started",
            note: "Starting work",
          }),
        });

        // Wait a bit to accumulate work time
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // 3. Pause the TODO, which will record work time
        const pauseResponse = await app.request(`/todos/${todo.id}/activities`, {
          method: "POST",
          body: JSON.stringify({
            type: "paused",
            note: "Pausing work",
          }),
        });
        const pauseActivity = await pauseResponse.json();

        // 4. Try to delete the pause activity that has work time
        const deleteResponse = await app.request(`/todos/${todo.id}/activities/${pauseActivity.id}`, {
          method: "DELETE",
        });

        // 5. Verify deletion is forbidden
        expect(deleteResponse.status).toBe(403);
        const errorData = await deleteResponse.json();
        expect(errorData.error).toContain("work time calculations");
      });

      it("cannot delete the most recent state-changing activity", async () => {
        // 1. Create a TODO
        const createResponse = await app.request("/todos", {
          method: "POST",
          body: JSON.stringify({
            title: "State Change Activity Test",
            description: "Testing state change activity deletion",
            status: "pending",
          }),
        });
        const todo = await createResponse.json();

        // 2. Start the TODO (first 'started' activity)
        const startResponse = await app.request(`/todos/${todo.id}/activities`, {
          method: "POST",
          body: JSON.stringify({
            type: "started",
            note: "Starting work first time",
          }),
        });
        const startActivity = await startResponse.json();

        // 3. Pause the TODO
        await app.request(`/todos/${todo.id}/activities`, {
          method: "POST",
          body: JSON.stringify({
            type: "paused",
            note: "Pausing work",
          }),
        });

        // 4. Start again (second 'started' activity)
        const secondStartResponse = await app.request(`/todos/${todo.id}/activities`, {
          method: "POST",
          body: JSON.stringify({
            type: "started",
            note: "Starting work second time",
          }),
        });
        const secondStartActivity = await secondStartResponse.json();

        // 5. Try to delete the most recent 'started' activity
        const deleteLatestResponse = await app.request(`/todos/${todo.id}/activities/${secondStartActivity.id}`, {
          method: "DELETE",
        });

        // 6. Verify deletion is forbidden for the most recent state-changing activity
        expect(deleteLatestResponse.status).toBe(403);
        const latestErrorData = await deleteLatestResponse.json();
        expect(latestErrorData.error).toContain("most recent state-changing activity");

        // 7. But we can delete the first 'started' activity since it's not the most recent one
        const deleteFirstResponse = await app.request(`/todos/${todo.id}/activities/${startActivity.id}`, {
          method: "DELETE",
        });

        // 8. Verify first activity can be deleted
        expect(deleteFirstResponse.status).toBe(204);
      });

      it("returns 404 when trying to delete non-existent activity", async () => {
        // 1. Create a TODO
        const createResponse = await app.request("/todos", {
          method: "POST",
          body: JSON.stringify({
            title: "Non-existent Activity Test",
            description: "Testing non-existent activity deletion",
            status: "pending",
          }),
        });
        const todo = await createResponse.json();

        // 2. Try to delete an activity with a fake ID
        const fakeActivityId = "00000000-0000-4000-a000-000000000000"; // A valid UUID format but doesn't exist
        const deleteResponse = await app.request(`/todos/${todo.id}/activities/${fakeActivityId}`, {
          method: "DELETE",
        });

        // 3. Verify 404 response
        expect(deleteResponse.status).toBe(404);
        const errorData = await deleteResponse.json();
        expect(errorData.error).toBe("Activity not found");
      });
    });
  });
});
