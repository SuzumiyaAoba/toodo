import type { Context } from "hono";
import { Logger } from "tslog";
import { inject, injectable, singleton } from "tsyringe";
import { z } from "zod";
import { TOKENS } from "../../application/services/DependencyTokens";
import type { CreateTaskUseCase } from "../../application/usecases/task/CreateTaskUseCase";
import type { DeleteTaskUseCase } from "../../application/usecases/task/DeleteTaskUseCase";
import type { GetRootTasksUseCase } from "../../application/usecases/task/GetRootTasksUseCase";
import type { GetTaskByIdUseCase } from "../../application/usecases/task/GetTaskByIdUseCase";
import type { MoveTaskUseCase } from "../../application/usecases/task/MoveTaskUseCase";
import type { ReorderTasksUseCase } from "../../application/usecases/task/ReorderTasksUseCase";
import type { UpdateTaskUseCase } from "../../application/usecases/task/UpdateTaskUseCase";
import type { TaskStatus } from "../../domain/models/Task";
import {
  CircularReferenceError,
  ParentTaskNotFoundError,
  SelfReferenceError,
  TaskNotFoundError,
} from "../../domain/models/errors";
import {
  type CreateTaskInput,
  type MoveTaskInput,
  type PaginationInput,
  type ReorderTasksInput,
  type UpdateTaskInput,
  createTaskSchema,
  idSchema,
  moveTaskSchema,
  paginationSchema,
  reorderTasksSchema,
  updateTaskSchema,
} from "../../domain/models/schema/TaskSchema";
import { validateQuery, validateRequest } from "../utils/ValidationUtils";

const logger = new Logger({ name: "TaskController" });

@injectable()
@singleton()
export class TaskController {
  constructor(
    @inject(TOKENS.GetRootTasksUseCase)
    private getRootTasksUseCase: GetRootTasksUseCase,
    @inject(TOKENS.GetTaskByIdUseCase)
    private getTaskByIdUseCase: GetTaskByIdUseCase,
    @inject(TOKENS.CreateTaskUseCase)
    private createTaskUseCase: CreateTaskUseCase,
    @inject(TOKENS.UpdateTaskUseCase)
    private updateTaskUseCase: UpdateTaskUseCase,
    @inject(TOKENS.DeleteTaskUseCase)
    private deleteTaskUseCase: DeleteTaskUseCase,
    @inject(TOKENS.MoveTaskUseCase) private moveTaskUseCase: MoveTaskUseCase,
    @inject(TOKENS.ReorderTasksUseCase)
    private reorderTasksUseCase: ReorderTasksUseCase,
  ) {}

  getRootTasks = async (c: Context) => {
    try {
      // Validate query parameters
      const validationResult = validateQuery<PaginationInput>(c, paginationSchema);
      if (!("success" in validationResult)) {
        return validationResult;
      }

      const { page, limit } = validationResult.data;
      const tasks = await this.getRootTasksUseCase.execute({ page, limit });
      return c.json(tasks);
    } catch (error) {
      logger.error("Failed to get root tasks:", error);
      return c.json({ error: "Failed to get task list" }, 500);
    }
  };

  getTaskById = async (c: Context) => {
    try {
      const id = c.req.param("id");

      // Validate ID
      try {
        idSchema.parse(id);
      } catch (error) {
        return c.json({ error: "Invalid task ID" }, 400);
      }

      const task = await this.getTaskByIdUseCase.execute(id);

      if (!task) {
        return c.json({ error: "Task not found" }, 404);
      }

      return c.json(task);
    } catch (error) {
      logger.error("Failed to get task:", error);
      return c.json({ error: "Failed to get task" }, 500);
    }
  };

  create = async (c: Context) => {
    try {
      // Validate request body
      const validationResult = await validateRequest<CreateTaskInput>(c, createTaskSchema);
      if (!("success" in validationResult)) {
        return validationResult;
      }

      const { title, description, parentId } = validationResult.data;

      try {
        const task = await this.createTaskUseCase.execute({
          title,
          description: description === undefined ? null : description,
          parentId: parentId === undefined ? null : parentId,
        });

        return c.json(task, 201);
      } catch (error) {
        // Check for parent not found error
        if (error instanceof ParentTaskNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        // Re-throw for general error handling
        throw error;
      }
    } catch (error) {
      logger.error("Failed to create task:", error);
      return c.json({ error: "Failed to create task" }, 500);
    }
  };

  update = async (c: Context) => {
    try {
      const id = c.req.param("id");

      // Validate ID and request body together
      const validationResult = await validateRequest<UpdateTaskInput>(
        c,
        updateTaskSchema.extend({
          id: idSchema.default(id), // Use ID from URL parameter as default
        }),
      );

      if (!("success" in validationResult)) {
        return validationResult;
      }

      const { title, description, status } = validationResult.data;

      // Create update object removing undefined properties
      const updateData: {
        id: string;
        title?: string;
        description?: string | null;
        status?: TaskStatus;
      } = { id };

      if (title !== undefined) {
        updateData.title = title;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      const task = await this.updateTaskUseCase.execute(updateData);

      if (!task) {
        return c.json({ error: "Task not found" }, 404);
      }

      return c.json(task);
    } catch (error) {
      logger.error("Failed to update task:", error);
      return c.json({ error: "Failed to update task" }, 500);
    }
  };

  delete = async (c: Context) => {
    try {
      const id = c.req.param("id");

      // Validate ID
      try {
        idSchema.parse(id);
      } catch (error) {
        return c.json({ error: "Invalid task ID" }, 400);
      }

      const success = await this.deleteTaskUseCase.execute(id);

      if (!success) {
        return c.json({ error: "Task not found" }, 404);
      }

      return c.json({ success: true });
    } catch (error) {
      logger.error("Failed to delete task:", error);
      return c.json({ error: "Failed to delete task" }, 500);
    }
  };

  move = async (c: Context) => {
    try {
      const id = c.req.param("id");

      // Validate ID and request body together
      const validationResult = await validateRequest<MoveTaskInput>(
        c,
        moveTaskSchema
          .extend({
            taskId: idSchema.default(id), // Use ID from URL parameter as default
          })
          .superRefine((data, ctx) => {
            if (data.taskId !== id) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Body taskId must match URL parameter",
                path: ["taskId"],
              });
            }
          }),
      );

      if (!("success" in validationResult)) {
        return validationResult;
      }

      const { taskId, newParentId } = validationResult.data;

      try {
        const task = await this.moveTaskUseCase.execute({
          taskId,
          newParentId,
        });

        return c.json(task);
      } catch (error) {
        if (error instanceof TaskNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (error instanceof ParentTaskNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (error instanceof CircularReferenceError || error instanceof SelfReferenceError) {
          return c.json({ error: error.message }, 400);
        }
        throw error;
      }
    } catch (error) {
      logger.error("Failed to move task:", error);
      return c.json({ error: "Failed to move task" }, 500);
    }
  };

  reorder = async (c: Context) => {
    try {
      const parentId = c.req.param("parentId") || null;

      // Validate request body
      const validationResult = await validateRequest<ReorderTasksInput>(
        c,
        reorderTasksSchema.extend({
          parentId: parentId ? idSchema.default(parentId) : idSchema.nullable().default(null),
        }),
      );

      if (!("success" in validationResult)) {
        return validationResult;
      }

      const { orderMap } = validationResult.data;

      const tasks = await this.reorderTasksUseCase.execute({
        parentId,
        orderMap,
      });

      return c.json(tasks);
    } catch (error) {
      logger.error("Failed to reorder tasks:", error);
      return c.json({ error: "Failed to reorder tasks" }, 500);
    }
  };
}
