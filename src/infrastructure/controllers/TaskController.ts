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
  type MoveTaskInput,
  type ReorderTasksInput,
  type UpdateTaskInput,
  idSchema,
  moveTaskSchema,
  reorderTasksSchema,
  updateTaskSchema,
} from "../../domain/models/schema/TaskSchema";
import { validateRequest } from "../utils/ValidationUtils";

const logger = new Logger({ name: "TaskController" });

/**
 * Controller for handling Task-related HTTP requests
 *
 * This class acts as the interface between the HTTP layer and the application layer.
 * It processes incoming requests, validates data, delegates to appropriate use cases,
 * and transforms the use case results into proper HTTP responses.
 *
 * All methods follow a consistent pattern:
 * 1. Extract and validate input data from request context
 * 2. Call the appropriate use case with validated data
 * 3. Return a properly formatted HTTP response
 * 4. Handle errors and return appropriate error responses
 */
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
      // zValidator によって検証されたデータを取得
      // @ts-ignore - zValidator の型の問題を回避
      const query = c.req.valid("query") as {
        page: number;
        limit: number;
      };
      const tasks = await this.getRootTasksUseCase.execute({
        page: query.page,
        limit: query.limit,
      });
      return c.json(tasks, 200);
    } catch (error) {
      logger.error("Failed to get root tasks:", error);
      return c.json({ error: "Failed to get task list" }, 500);
    }
  };

  getTaskById = async (c: Context) => {
    try {
      // zValidator によって検証されたデータを取得
      // @ts-ignore - zValidator の型の問題を回避
      const params = c.req.valid("param") as {
        id: string;
      };
      const task = await this.getTaskByIdUseCase.execute(params.id);

      if (!task) {
        return c.json({ error: "Task not found" }, 404);
      }

      return c.json(task, 200);
    } catch (error) {
      logger.error("Failed to get task:", error);
      return c.json({ error: "Failed to get task" }, 500);
    }
  };

  create = async (c: Context) => {
    try {
      // zValidator によって検証されたデータを取得
      // @ts-ignore - zValidator の型の問題を回避
      const data = c.req.valid("json") as {
        title: string;
        description?: string;
        parentId?: string;
      };

      try {
        const task = await this.createTaskUseCase.execute({
          title: data.title,
          description: data.description === undefined ? null : data.description,
          parentId: data.parentId === undefined ? null : data.parentId,
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
      const parentId = c.req.param("parentId");

      // Determine if we're reordering tasks under a specific parent
      // or root tasks (when parentId is not in URL)
      const hasParentIdInUrl = parentId !== undefined;

      // Prepare schema based on URL path
      if (hasParentIdInUrl) {
        // If parentId is in URL, validate it and use it
        try {
          idSchema.parse(parentId);
        } catch (error) {
          return c.json({ error: "Invalid parent ID" }, 400);
        }

        // Create a custom schema for parent-specific reordering
        const schemaWithFixedParent = z.object({
          orderMap: reorderTasksSchema.shape.orderMap,
        });

        // Validate request body
        const validationResult = await validateRequest<{
          orderMap: Record<string, number>;
        }>(c, schemaWithFixedParent);

        if (!("success" in validationResult)) {
          return validationResult;
        }

        const { orderMap } = validationResult.data;

        // Execute with fixed parentId from URL
        return this.executeReordering(c, orderMap, parentId);
      }

      // For root tasks or when parentId is in the body
      const validationResult = await validateRequest<ReorderTasksInput>(c, reorderTasksSchema);

      if (!("success" in validationResult)) {
        return validationResult;
      }

      const { orderMap, parentId: bodyParentId } = validationResult.data;

      // Execute with parentId from body
      return this.executeReordering(c, orderMap, bodyParentId);
    } catch (error) {
      logger.error("Failed to reorder tasks:", error);
      return c.json({ error: "Failed to reorder tasks" }, 500);
    }
  };

  private async executeReordering(c: Context, orderMap: Record<string, number>, parentId: string | null) {
    try {
      // Execute the reorder use case
      const tasks = await this.reorderTasksUseCase.execute({
        parentId,
        orderMap,
      });

      return c.json({ success: true, tasks });
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      throw error;
    }
  }
}
