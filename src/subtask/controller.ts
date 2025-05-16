import { Context } from "hono";
import { Logger } from "tslog";
import {
  SubtaskUseCases,
  AddSubtaskDTO,
  UpdateSubtaskDTO,
  ReorderSubtasksDTO,
} from "./usecases";

// Create a logger instance
const logger = new Logger({ name: "SubtaskController" });

/**
 * Controller handling HTTP requests related to Subtasks
 * Acts as part of the infrastructure layer to bridge HTTP requests with application layer use cases
 */
export class SubtaskController {
  /**
   * Constructor for SubtaskController class
   * @param subtaskUseCases Implementation of Subtask use cases
   */
  constructor(private subtaskUseCases: SubtaskUseCases) {}

  /**
   * Endpoint handler for retrieving all subtasks belonging to a specific Todo
   * GET /api/todos/:todoId/subtasks
   */
  getByTodoId = async (c: Context) => {
    try {
      const todoId = c.req.param("todoId");
      const subtasks = await this.subtaskUseCases.getSubtasksByTodoId(todoId);
      return c.json(subtasks);
    } catch (error) {
      logger.error("Failed to get subtasks:", error);
      return c.json({ error: "Failed to get subtasks" }, 500);
    }
  };

  /**
   * Endpoint handler for adding a new subtask
   * POST /api/todos/:todoId/subtasks
   */
  add = async (c: Context) => {
    try {
      const todoId = c.req.param("todoId");
      const { title, description = null } = await c.req.json();

      if (!title) {
        return c.json({ error: "Title is required" }, 400);
      }

      const dto: AddSubtaskDTO = {
        todoId,
        title,
        description,
      };

      const subtask = await this.subtaskUseCases.addSubtask(dto);

      if (!subtask) {
        return c.json({ error: "Todo not found" }, 404);
      }

      return c.json(subtask, 201);
    } catch (error) {
      logger.error("Failed to create subtask:", error);
      return c.json({ error: "Failed to create subtask" }, 500);
    }
  };

  /**
   * Endpoint handler for updating an existing subtask
   * PUT /api/subtasks/:id
   */
  update = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const { title, description, status } = await c.req.json();

      // Validate status if provided
      if (status && !["completed", "incomplete"].includes(status)) {
        return c.json(
          { error: "Invalid status. Must be 'completed' or 'incomplete'" },
          400
        );
      }

      const dto: UpdateSubtaskDTO = {
        id,
        title,
        description,
        status: status as any,
      };

      const subtask = await this.subtaskUseCases.updateSubtask(dto);

      if (!subtask) {
        return c.json({ error: "Subtask not found" }, 404);
      }

      return c.json(subtask);
    } catch (error) {
      logger.error("Failed to update subtask:", error);
      return c.json({ error: "Failed to update subtask" }, 500);
    }
  };

  /**
   * Endpoint handler for deleting a subtask
   * DELETE /api/subtasks/:id
   */
  delete = async (c: Context) => {
    try {
      const id = c.req.param("id");

      const success = await this.subtaskUseCases.deleteSubtask(id);

      if (!success) {
        return c.json({ error: "Subtask not found" }, 404);
      }

      return c.json({ success: true });
    } catch (error) {
      logger.error("Failed to delete subtask:", error);
      return c.json({ error: "Failed to delete subtask" }, 500);
    }
  };

  /**
   * Endpoint handler for reordering subtasks
   * PUT /api/todos/:todoId/subtasks/reorder
   */
  reorder = async (c: Context) => {
    try {
      const todoId = c.req.param("todoId");
      const { orderMap } = await c.req.json();

      if (!orderMap || typeof orderMap !== "object") {
        return c.json(
          { error: "orderMap is required and must be an object" },
          400
        );
      }

      const dto: ReorderSubtasksDTO = {
        todoId,
        orderMap,
      };

      const subtasks = await this.subtaskUseCases.reorderSubtasks(dto);

      if (!subtasks) {
        return c.json({ error: "Todo not found" }, 404);
      }

      return c.json(subtasks);
    } catch (error) {
      logger.error("Failed to reorder subtasks:", error);
      return c.json({ error: "Failed to reorder subtasks" }, 500);
    }
  };
}
