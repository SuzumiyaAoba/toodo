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
  TodoActivityListSchema,
  TodoActivitySchema,
  TodoListSchema,
  TodoSchema,
  UpdateTodoSchema,
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

    // Create the activity
    const activity = await prisma.todoActivity.create({
      data: {
        todoId: id,
        type,
        note,
      },
    });

    // If the activity type is "completed", also update the TODO status
    if (type === "completed") {
      await prisma.todo.update({
        where: { id },
        data: { status: "completed" },
      });
    }

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

export default app;
