import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { PrismaClient } from "./generated/prisma";

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
  });
});
