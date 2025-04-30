import { Hono } from "hono";
import * as v from "valibot";
import { AddSubtaskUseCase } from "../../application/use-cases/todo/add-subtask";
import { CreateTodoUseCase } from "../../application/use-cases/todo/create-todo";
import { GetSubtaskTreeUseCase } from "../../application/use-cases/todo/get-subtask-tree";
import { GetSubtasksUseCase } from "../../application/use-cases/todo/get-subtasks";
import { RemoveSubtaskUseCase } from "../../application/use-cases/todo/remove-subtask";
import type { PriorityLevel, Todo } from "../../domain/entities/todo";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import { prisma } from "../../infrastructure/db";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import { validate } from "../middlewares/validate";
import { IdParamSchema } from "../schemas/common-schemas";
import { TodoSchema } from "../schemas/todo-schemas";
import { convertToResponseSchema } from "../utils/schema-converter";

const TodoSubtaskParamSchema = v.object({
  id: v.string(),
  subtaskId: v.string(),
});

const CreateSubtaskSchema = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  priority: v.optional(v.string()),
  dueDate: v.optional(v.string()),
});

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
  const params = c.req.valid("param") as { id: string };
  const subtasks = await getSubtasksUseCase.execute({ todoId: params.id });
  const response = await Promise.all(subtasks.map((subtask) => convertToResponseSchema(subtask, TodoSchema)));
  return c.json(response);
});

// Retrieve the tree of subtasks
subtaskRoutes.get("/:id/subtask-tree", validate("param", IdParamSchema), async (c) => {
  const params = c.req.valid("param") as { id: string };
  const maxDepth = c.req.query("maxDepth") ? Number.parseInt(c.req.query("maxDepth")!, 10) : undefined;

  const subtaskTree = await getSubtaskTreeUseCase.execute({
    todoId: params.id,
    maxDepth,
  });

  interface TodoWithSubtasks extends Todo {
    subtasks?: Todo[];
  }

  const convertToTreeFormat = async (todo: TodoWithSubtasks): Promise<Record<string, unknown>> => {
    const formattedTodo = (await convertToResponseSchema(todo, TodoSchema)) as Record<string, unknown>;
    return {
      ...formattedTodo,
      subtasks: await Promise.all((todo.subtasks || []).map((subtask) => convertToTreeFormat(subtask))),
    };
  };

  const response = await convertToTreeFormat(subtaskTree as unknown as TodoWithSubtasks);
  return c.json(response);
});

// Add a subtask to a parent task
subtaskRoutes.post("/:id/subtasks/:subtaskId", validate("param", TodoSubtaskParamSchema), async (c) => {
  const params = c.req.valid("param") as { id: string; subtaskId: string };
  await addSubtaskUseCase.execute({
    parentId: params.id,
    subtaskId: params.subtaskId,
  });
  c.status(201);
  return c.body(null);
});

// Remove a subtask from a parent task
subtaskRoutes.delete("/:id/subtasks/:subtaskId", validate("param", TodoSubtaskParamSchema), async (c) => {
  const params = c.req.valid("param") as { id: string; subtaskId: string };
  await removeSubtaskUseCase.execute({
    parentId: params.id,
    subtaskId: params.subtaskId,
  });
  c.status(204);
  return c.body(null);
});

// Create a new subtask and add it to a parent task
subtaskRoutes.post(
  "/:id/create-subtask",
  validate("param", IdParamSchema),
  validate("json", CreateSubtaskSchema),
  async (c) => {
    const params = c.req.valid("param") as { id: string };
    const data = c.req.valid("json") as {
      title: string;
      description?: string;
      priority?: string;
      dueDate?: string;
    };

    // Create the subtask
    const subtask = await createTodoUseCase.execute({
      title: data.title,
      description: data.description,
      priority: data.priority as PriorityLevel | undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });

    // Add it as a subtask
    await addSubtaskUseCase.execute({
      parentId: params.id,
      subtaskId: subtask.id,
    });

    const response = await convertToResponseSchema(subtask, TodoSchema);
    return c.json(response, 201);
  },
);

export { subtaskRoutes };
