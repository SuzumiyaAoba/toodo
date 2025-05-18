import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import {
  createTaskSchema,
  idSchema,
  moveTaskSchema,
  paginationSchema,
  reorderTasksSchema,
  taskStatusSchema,
  updateTaskSchema,
} from "../../domain/models/schema/TaskSchema";

// Task response schema
const taskResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  status: taskStatusSchema,
  order: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  childTasks: z.array(z.lazy(() => taskResponseSchema)).optional(),
});

// Error response schema
const errorResponseSchema = z.object({
  error: z.string(),
  details: z.record(z.string(), z.string()).optional(),
});

// Success response schema
const successResponseSchema = z.object({
  success: z.boolean(),
});

// Define routes with OpenAPI specs
export const getRootTasksRoute = createRoute({
  method: "get",
  path: "/api/tasks",
  request: {
    query: paginationSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(taskResponseSchema),
        },
      },
      description: "Success",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Server Error",
    },
  },
  tags: ["Tasks"],
  summary: "Get root tasks",
  description: "Retrieve all root-level tasks with pagination",
});

export const getTaskByIdRoute = createRoute({
  method: "get",
  path: "/api/tasks/{id}",
  request: {
    params: z.object({
      id: idSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: taskResponseSchema,
        },
      },
      description: "Success",
    },
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Task not found",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Server Error",
    },
  },
  tags: ["Tasks"],
  summary: "Get task by ID",
  description: "Retrieve a task by its ID, including its child tasks",
});

export const createTaskRoute = createRoute({
  method: "post",
  path: "/api/tasks",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createTaskSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: taskResponseSchema,
        },
      },
      description: "Task created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Validation Error",
    },
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Parent Task not found",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Server Error",
    },
  },
  tags: ["Tasks"],
  summary: "Create a new task",
  description: "Create a new task with optional parent task reference",
});

export const updateTaskRoute = createRoute({
  method: "patch",
  path: "/api/tasks/{id}",
  request: {
    params: z.object({
      id: idSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: updateTaskSchema.omit({ id: true }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: taskResponseSchema,
        },
      },
      description: "Task updated successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Validation Error",
    },
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Task not found",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Server Error",
    },
  },
  tags: ["Tasks"],
  summary: "Update a task",
  description: "Update a task properties by its ID",
});

export const deleteTaskRoute = createRoute({
  method: "delete",
  path: "/api/tasks/{id}",
  request: {
    params: z.object({
      id: idSchema,
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema,
        },
      },
      description: "Task deleted successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Validation Error",
    },
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Task not found",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Server Error",
    },
  },
  tags: ["Tasks"],
  summary: "Delete a task",
  description: "Delete a task and its children by ID",
});

export const moveTaskRoute = createRoute({
  method: "patch",
  path: "/api/tasks/{id}/move",
  request: {
    params: z.object({
      id: idSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: moveTaskSchema.omit({ taskId: true }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: taskResponseSchema,
        },
      },
      description: "Task moved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Validation Error or Circular Reference",
    },
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Task not found or Parent not found",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Server Error",
    },
  },
  tags: ["Tasks"],
  summary: "Move a task",
  description: "Move a task to a new parent",
});

export const reorderTasksRoute = createRoute({
  method: "put",
  path: "/api/tasks/reorder",
  request: {
    body: {
      content: {
        "application/json": {
          schema: reorderTasksSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema,
        },
      },
      description: "Tasks reordered successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Validation Error",
    },
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Tasks not found",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Server Error",
    },
  },
  tags: ["Tasks"],
  summary: "Reorder tasks",
  description: "Reorder tasks under the same parent",
});

export const reorderParentTasksRoute = createRoute({
  method: "put",
  path: "/api/tasks/{parentId}/reorder",
  request: {
    params: z.object({
      parentId: idSchema,
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            orderMap: z.record(z.string().uuid(), z.number().int().positive()),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: successResponseSchema,
        },
      },
      description: "Tasks reordered successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Validation Error",
    },
    404: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Parent task not found",
    },
    500: {
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
      description: "Server Error",
    },
  },
  tags: ["Tasks"],
  summary: "Reorder tasks under specific parent",
  description: "Reorder tasks under a specific parent",
});

// Define the OpenAPI document
export const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "Toodo API",
    version: "1.0.0",
    description: "API for managing tasks in the Toodo application",
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Local development server",
    },
  ],
};
