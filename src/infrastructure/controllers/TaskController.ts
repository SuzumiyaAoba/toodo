import type { Context } from "hono";
import { Logger } from "tslog";
import type { CreateTaskUseCase } from "../../application/usecases/task/CreateTaskUseCase";
import type { DeleteTaskUseCase } from "../../application/usecases/task/DeleteTaskUseCase";
import type { GetRootTasksUseCase } from "../../application/usecases/task/GetRootTasksUseCase";
import type { GetTaskByIdUseCase } from "../../application/usecases/task/GetTaskByIdUseCase";
import type { MoveTaskUseCase } from "../../application/usecases/task/MoveTaskUseCase";
import type { ReorderTasksUseCase } from "../../application/usecases/task/ReorderTasksUseCase";
import type { UpdateTaskUseCase } from "../../application/usecases/task/UpdateTaskUseCase";
import type { TaskStatus } from "../../domain/models/Task";

const logger = new Logger({ name: "TaskController" });

export class TaskController {
  constructor(
    private getRootTasksUseCase: GetRootTasksUseCase,
    private getTaskByIdUseCase: GetTaskByIdUseCase,
    private createTaskUseCase: CreateTaskUseCase,
    private updateTaskUseCase: UpdateTaskUseCase,
    private deleteTaskUseCase: DeleteTaskUseCase,
    private moveTaskUseCase: MoveTaskUseCase,
    private reorderTasksUseCase: ReorderTasksUseCase,
  ) {}

  getRootTasks = async (c: Context) => {
    try {
      // Get pagination parameters from query
      const page = Number.parseInt(c.req.query("page") || "1", 10);
      const limit = Number.parseInt(c.req.query("limit") || "20", 10);

      // Validate pagination parameters
      if (Number.isNaN(page) || page < 1 || Number.isNaN(limit) || limit < 1 || limit > 100) {
        return c.json({ error: "Invalid pagination parameters" }, 400);
      }

      const tasks = await this.getRootTasksUseCase.execute({ page, limit });
      return c.json(tasks);
    } catch (error) {
      logger.error("Failed to get root tasks:", error);
      return c.json({ error: "Failed to get root tasks" }, 500);
    }
  };

  getTaskById = async (c: Context) => {
    try {
      const id = c.req.param("id");
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
      const { title, description = null, parentId = null } = await c.req.json();

      if (!title) {
        return c.json({ error: "Title is required" }, 400);
      }

      const task = await this.createTaskUseCase.execute({
        title,
        description,
        parentId,
      });

      return c.json(task, 201);
    } catch (error) {
      logger.error("Failed to create task:", error);
      return c.json({ error: "Failed to create task" }, 500);
    }
  };

  update = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const { title, description, status } = await c.req.json();

      // Validate status if provided
      if (status && !["completed", "incomplete"].includes(status)) {
        return c.json({ error: "Invalid status. Must be 'completed' or 'incomplete'" }, 400);
      }

      const task = await this.updateTaskUseCase.execute({
        id,
        title,
        description,
        status: status as TaskStatus,
      });

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
      const { parentId } = await c.req.json();

      const task = await this.moveTaskUseCase.execute({
        taskId: id,
        newParentId: parentId,
      });

      if (!task) {
        return c.json({ error: "Task not found" }, 404);
      }

      return c.json(task);
    } catch (error) {
      logger.error("Failed to move task:", error);
      return c.json({ error: "Failed to move task" }, 500);
    }
  };

  reorder = async (c: Context) => {
    try {
      const parentId = c.req.param("parentId") || null;
      const { orderMap } = await c.req.json();

      if (!orderMap || typeof orderMap !== "object") {
        return c.json({ error: "orderMap is required and must be an object" }, 400);
      }

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
