import { Hono } from "hono";
import { PrismaClient } from "./generated/prisma";

import { Scalar } from "@scalar/hono-api-reference";
import type { ConversionConfig } from "@valibot/to-json-schema";
import { describeRoute, openAPISpecs } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import {
  CreateTodoActivitySchema,
  CreateTodoSchema,
  ErrorResponseSchema,
  IdParamSchema,
  TodoActivityIdParamSchema,
  TodoActivityListSchema,
  TodoActivitySchema,
  TodoListSchema,
  TodoSchema,
  UpdateTodoSchema,
  WorkTimeResponseSchema,
} from "./schema";

const app = new Hono();
const prisma = new PrismaClient();

const valibotConfig: ConversionConfig = {
  errorMode: "ignore",
};

app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Toodo API",
        version: "1.0.0",
        description: "Toodo API",
      },
      servers: [{ url: "http://localhost:3000", description: "Local Server" }],
    },
  }),
);

app.get(
  "/scalar",
  Scalar({
    theme: "saturn",
    spec: { url: "/openapi" },
  }),
);

// Create a TODO
app.post(
  "/todos",
  describeRoute({
    description: "Create a new TODO",
    responses: {
      201: {
        description: "TODO created successfully",
        content: {
          "application/json": {
            schema: resolver(TodoSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  vValidator("json", CreateTodoSchema),
  async (c) => {
    const { title, description, status } = c.req.valid("json");
    const todo = await prisma.todo.create({
      data: { title, description, status },
    });

    return c.json(todo, 201);
  },
);

// Get TODO list
app.get(
  "/todos",
  describeRoute({
    description: "Get the list of TODOs",
    responses: {
      200: {
        description: "List of TODOs",
        content: {
          "application/json": {
            schema: resolver(TodoListSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  async (c) => {
    const todos = await prisma.todo.findMany();
    return c.json(todos);
  },
);

// Get TODO details
app.get(
  "/todos/:id",
  describeRoute({
    description: "Get the details of a TODO",
    responses: {
      200: {
        description: "TODO details",
        content: {
          "application/json": {
            schema: resolver(TodoSchema, valibotConfig),
          },
        },
      },
      404: {
        description: "TODO not found",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  vValidator("param", IdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) return c.json({ error: "Todo not found" }, 404);
    return c.json(todo);
  },
);

// Update a TODO
app.put(
  "/todos/:id",
  describeRoute({
    description: "Update a TODO",
    responses: {
      200: {
        description: "TODO updated successfully",
        content: {
          "application/json": {
            schema: resolver(TodoSchema, valibotConfig),
          },
        },
      },
      404: {
        description: "TODO not found",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  vValidator("param", IdParamSchema),
  vValidator("json", UpdateTodoSchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const updateData = c.req.valid("json");

    // Fetch the existing TODO
    const existingTodo = await prisma.todo.findUnique({ where: { id } });
    if (!existingTodo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    // Update only the fields specified in the request
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
  },
);

// Delete a TODO
app.delete(
  "/todos/:id",
  describeRoute({
    description: "Delete a TODO",
    responses: {
      204: {
        description: "TODO deleted successfully",
      },
      404: {
        description: "TODO not found",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  vValidator("param", IdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");

    // Check if the TODO exists
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    // Create a "discarded" activity before deleting the TODO
    await prisma.todoActivity.create({
      data: {
        todoId: id,
        type: "discarded",
        note: "TODO was deleted from the system",
      },
    });

    // Delete the TODO
    await prisma.todo.delete({ where: { id } });
    c.status(204);
    return c.body(null);
  },
);

// Record a TODO activity
app.post(
  "/todos/:id/activities",
  describeRoute({
    description: "Record a new activity for a TODO",
    responses: {
      201: {
        description: "Activity recorded successfully",
        content: {
          "application/json": {
            schema: resolver(TodoActivitySchema, valibotConfig),
          },
        },
      },
      400: {
        description: "Invalid activity data",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
      404: {
        description: "TODO not found",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  vValidator("param", IdParamSchema),
  vValidator("json", CreateTodoActivitySchema),
  async (c) => {
    const { id } = c.req.valid("param");
    const { type, note } = c.req.valid("json");

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
  },
);

// Get TODO activity history
app.get(
  "/todos/:id/activities",
  describeRoute({
    description: "Get activity history of a specific TODO",
    responses: {
      200: {
        description: "Activity history",
        content: {
          "application/json": {
            schema: resolver(TodoActivityListSchema, valibotConfig),
          },
        },
      },
      404: {
        description: "TODO not found",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  vValidator("param", IdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");

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
  },
);

// Get TODO work time
app.get(
  "/todos/:id/work-time",
  describeRoute({
    description: "Get the total work time of a TODO",
    responses: {
      200: {
        description: "Work time information",
        content: {
          "application/json": {
            schema: resolver(WorkTimeResponseSchema, valibotConfig),
          },
        },
      },
      404: {
        description: "TODO not found",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  vValidator("param", IdParamSchema),
  async (c) => {
    const { id } = c.req.valid("param");

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
  },
);

// Delete a TODO activity
app.delete(
  "/todos/:id/activities/:activityId",
  describeRoute({
    description: "Delete a TODO activity",
    responses: {
      204: {
        description: "Activity deleted successfully",
      },
      403: {
        description: "Cannot delete this activity",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
      404: {
        description: "Activity not found",
        content: {
          "application/json": {
            schema: resolver(ErrorResponseSchema, valibotConfig),
          },
        },
      },
    },
    validateResponse: true,
  }),
  vValidator("param", TodoActivityIdParamSchema),
  async (c) => {
    const { id, activityId } = c.req.valid("param");

    // 1. Check if the TODO exists
    const todo = await prisma.todo.findUnique({ where: { id } });
    if (!todo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    // 2. Check if the activity exists and belongs to the TODO
    const activity = await prisma.todoActivity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return c.json({ error: "Activity not found" }, 404);
    }

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
  },
);

/**
 * Format work time in seconds to a human-readable string
 * @param seconds Total seconds
 * @returns Formatted time string (e.g., "2 hours, 30 minutes, 15 seconds")
 */
function formatWorkTime(seconds: number): string {
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

export default app;
