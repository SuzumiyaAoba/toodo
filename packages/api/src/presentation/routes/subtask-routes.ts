import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import * as v from "valibot";
import { AddSubtaskUseCase } from "../../application/use-cases/todo/add-subtask";
import { CreateTodoUseCase } from "../../application/use-cases/todo/create-todo";
import { GetSubtaskTreeUseCase } from "../../application/use-cases/todo/get-subtask-tree";
import { GetSubtasksUseCase } from "../../application/use-cases/todo/get-subtasks";
import { RemoveSubtaskUseCase } from "../../application/use-cases/todo/remove-subtask";
import { PriorityLevel } from "../../domain/entities/todo";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import { prisma } from "../../infrastructure/db";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import { validate } from "../middlewares/validate";
import {
  type CreateSubtaskRequest,
  CreateSubtaskSchema,
  SubtaskListSchema,
  SubtaskTreeNodeSchema,
  SubtaskTreeSchema,
  TodoSubtaskParamSchema,
} from "../schemas/subtask-schemas";
import { IdParamSchema, TodoSchema } from "../schemas/todo-schemas";
import { convertToResponseSchema } from "../utils/schema-converter";

// Subtask-related routes
const subtaskRoutes = new Hono();

// Initialize repository and use cases
const todoRepository = new PrismaTodoRepository(prisma);
const addSubtaskUseCase = new AddSubtaskUseCase(todoRepository);
const removeSubtaskUseCase = new RemoveSubtaskUseCase(todoRepository);
const getSubtasksUseCase = new GetSubtasksUseCase(todoRepository);
const getSubtaskTreeUseCase = new GetSubtaskTreeUseCase(todoRepository);
const createTodoUseCase = new CreateTodoUseCase(todoRepository);

// Retrieve the list of subtasks
subtaskRoutes.get("/:id/subtasks", validate("param", IdParamSchema), async (c) => {
  try {
    const { id } = c.req.valid("param") as { id: string };

    const subtasks = await getSubtasksUseCase.execute({ todoId: id });
    const responseBody = subtasks.map((subtask) => convertToResponseSchema(subtask, TodoSchema));

    return c.json(responseBody);
  } catch (error) {
    if (error instanceof TodoNotFoundError) {
      return c.json({ error: error.message }, 404);
    }
    console.error(error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

// Retrieve the tree of subtasks
subtaskRoutes.get("/:id/subtask-tree", validate("param", IdParamSchema), async (c) => {
  try {
    const { id } = c.req.valid("param") as { id: string };
    const maxDepth = c.req.query("maxDepth") ? Number.parseInt(c.req.query("maxDepth") as string, 10) : undefined;

    const subtaskTree = await getSubtaskTreeUseCase.execute({ todoId: id, maxDepth });

    // Define the type using the schema
    type SubtaskWithIds = {
      id: string;
      title: string;
      description?: string;
      status: string;
      workState: string;
      priority: string | undefined;
      dueDate?: string;
      subtaskIds: string[];
      [key: string]: unknown;
    };

    // Define our own SubtaskTreeNode type that matches the response structure
    type SubtaskTreeNode = {
      id: string;
      title: string;
      description?: string;
      status: string;
      workState: string;
      priority: string;
      dueDate?: string;
      subtasks: SubtaskTreeNode[];
    };

    // Conversion function for subtask tree (recursively structure subtasks)
    const convertToTreeFormat = (subtasks: SubtaskWithIds[]): SubtaskTreeNode[] => {
      return subtasks.map((subtask) => {
        const { subtaskIds, ...rest } = subtask;
        const formattedSubtask = convertToResponseSchema(rest, TodoSchema) as {
          id: string;
          title: string;
          description?: string;
          status: string;
          workState: string;
          priority: string | undefined;
          dueDate?: string;
        };

        const priorityValue = formattedSubtask.priority || "medium"; // Default to medium if undefined

        // Search for subtasks by subtask ID and recursively convert
        if (subtask.subtaskIds && subtask.subtaskIds.length > 0) {
          const childSubtasks = subtasks.filter((s) => subtask.subtaskIds.includes(s.id));
          return {
            id: formattedSubtask.id,
            title: formattedSubtask.title,
            description: formattedSubtask.description,
            status: formattedSubtask.status,
            workState: formattedSubtask.workState,
            priority: priorityValue,
            dueDate: formattedSubtask.dueDate,
            subtasks: convertToTreeFormat(childSubtasks),
          };
        }

        return {
          id: formattedSubtask.id,
          title: formattedSubtask.title,
          description: formattedSubtask.description,
          status: formattedSubtask.status,
          workState: formattedSubtask.workState,
          priority: priorityValue,
          dueDate: formattedSubtask.dueDate,
          subtasks: [],
        };
      });
    };

    // Convert Todo entity to SubtaskWithIds type
    const subtaskTreeWithIds = subtaskTree.map((todo) => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      status: todo.status,
      workState: todo.workState,
      priority: todo.priority,
      dueDate: todo.dueDate ? todo.dueDate.toISOString() : undefined,
      subtaskIds: todo.subtaskIds,
    })) as SubtaskWithIds[];

    const responseBody = convertToTreeFormat(subtaskTreeWithIds);
    return c.json(responseBody);
  } catch (error) {
    if (error instanceof TodoNotFoundError) {
      return c.json({ error: error.message }, 404);
    }
    console.error(error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

// Add a subtask to a parent task
subtaskRoutes.post("/:id/subtasks/:subtaskId", validate("param", TodoSubtaskParamSchema), async (c) => {
  try {
    const { id, subtaskId } = c.req.valid("param") as { id: string; subtaskId: string };

    await addSubtaskUseCase.execute({ parentId: id, subtaskId });
    return c.json({ success: true, message: "Subtask added successfully" }, 200);
  } catch (error) {
    if (error instanceof TodoNotFoundError) {
      return c.json({ error: error.message }, 404);
    }
    if (error instanceof Error && error.name === "DependencyCycleError") {
      return c.json({ error: error.message }, 400);
    }
    console.error(error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

// Remove a subtask from a parent task
subtaskRoutes.delete("/:id/subtasks/:subtaskId", validate("param", TodoSubtaskParamSchema), async (c) => {
  try {
    const { id, subtaskId } = c.req.valid("param") as { id: string; subtaskId: string };

    await removeSubtaskUseCase.execute({ parentId: id, subtaskId });
    return c.json({ success: true, message: "Subtask removed successfully" }, 200);
  } catch (error) {
    if (error instanceof TodoNotFoundError) {
      return c.json({ error: error.message }, 404);
    }
    console.error(error);
    return c.json({ error: "An unexpected error occurred" }, 500);
  }
});

// Create a new subtask and add it to a parent task
subtaskRoutes.post(
  "/:id/create-subtask",
  validate("param", IdParamSchema),
  validate("json", CreateSubtaskSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param") as { id: string };
      const { title, description, priority } = c.req.valid("json") as CreateSubtaskRequest;

      // Convert string priority to PriorityLevel type
      let priorityLevel = undefined;
      if (priority) {
        switch (priority.toLowerCase()) {
          case "low":
            priorityLevel = PriorityLevel.LOW;
            break;
          case "medium":
            priorityLevel = PriorityLevel.MEDIUM;
            break;
          case "high":
            priorityLevel = PriorityLevel.HIGH;
            break;
          default:
            priorityLevel = PriorityLevel.MEDIUM;
        }
      }

      // Create a new subtask
      const subtask = await createTodoUseCase.execute({
        title,
        description,
        priority: priorityLevel,
        parentId: id,
      });

      const responseBody = convertToResponseSchema(subtask, TodoSchema);
      return c.json(responseBody, 201);
    } catch (error) {
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      console.error(error);
      return c.json({ error: "An unexpected error occurred" }, 500);
    }
  },
);

export { subtaskRoutes };
