import { Context } from "hono";
import { Logger } from "tslog";
import { AddSubtaskUseCase } from "../../application/usecases/subtask/AddSubtaskUseCase";
import { DeleteSubtaskUseCase } from "../../application/usecases/subtask/DeleteSubtaskUseCase";
import { ReorderSubtasksUseCase } from "../../application/usecases/subtask/ReorderSubtasksUseCase";
import { UpdateSubtaskUseCase } from "../../application/usecases/subtask/UpdateSubtaskUseCase";
import { SubtaskRepository } from "../../domain/repositories/SubtaskRepository";

const logger = new Logger({ name: "SubtaskController" });

export class SubtaskController {
  constructor(
    private subtaskRepository: SubtaskRepository,
    private addSubtaskUseCase: AddSubtaskUseCase,
    private updateSubtaskUseCase: UpdateSubtaskUseCase,
    private deleteSubtaskUseCase: DeleteSubtaskUseCase,
    private reorderSubtasksUseCase: ReorderSubtasksUseCase
  ) {}

  getByTodoId = async (c: Context) => {
    try {
      const todoId = c.req.param("todoId");
      const subtasks = await this.subtaskRepository.findByTodoId(todoId);
      return c.json(subtasks);
    } catch (error) {
      logger.error("Failed to get subtasks:", error);
      return c.json({ error: "Failed to get subtasks" }, 500);
    }
  };

  add = async (c: Context) => {
    try {
      const todoId = c.req.param("todoId");
      const { title, description = null } = await c.req.json();

      if (!title) {
        return c.json({ error: "Title is required" }, 400);
      }

      const subtask = await this.addSubtaskUseCase.execute({
        todoId,
        title,
        description,
      });

      if (!subtask) {
        return c.json({ error: "Todo not found" }, 404);
      }

      return c.json(subtask, 201);
    } catch (error) {
      logger.error("Failed to create subtask:", error);
      return c.json({ error: "Failed to create subtask" }, 500);
    }
  };

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

      const subtask = await this.updateSubtaskUseCase.execute({
        id,
        title,
        description,
        status: status as any,
      });

      if (!subtask) {
        return c.json({ error: "Subtask not found" }, 404);
      }

      return c.json(subtask);
    } catch (error) {
      logger.error("Failed to update subtask:", error);
      return c.json({ error: "Failed to update subtask" }, 500);
    }
  };

  delete = async (c: Context) => {
    try {
      const id = c.req.param("id");

      const success = await this.deleteSubtaskUseCase.execute(id);

      if (!success) {
        return c.json({ error: "Subtask not found" }, 404);
      }

      return c.json({ success: true });
    } catch (error) {
      logger.error("Failed to delete subtask:", error);
      return c.json({ error: "Failed to delete subtask" }, 500);
    }
  };

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

      const subtasks = await this.reorderSubtasksUseCase.execute({
        todoId,
        orderMap,
      });

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
