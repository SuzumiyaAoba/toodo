import type { Context } from "hono";
import { Logger } from "tslog";
import type { CreateTodoUseCase } from "../../application/usecases/todo/CreateTodoUseCase";
import type { DeleteTodoUseCase } from "../../application/usecases/todo/DeleteTodoUseCase";
import type { GetAllTodosUseCase } from "../../application/usecases/todo/GetAllTodosUseCase";
import type { UpdateTodoUseCase } from "../../application/usecases/todo/UpdateTodoUseCase";

const logger = new Logger({ name: "TodoController" });

export class TodoController {
  constructor(
    private getAllTodosUseCase: GetAllTodosUseCase,
    private createTodoUseCase: CreateTodoUseCase,
    private updateTodoUseCase: UpdateTodoUseCase,
    private deleteTodoUseCase: DeleteTodoUseCase,
  ) {}

  getAll = async (c: Context) => {
    try {
      const todos = await this.getAllTodosUseCase.execute();
      return c.json(todos);
    } catch (error) {
      logger.error("Failed to get todos:", error);
      return c.json({ error: "Failed to get todos" }, 500);
    }
  };

  create = async (c: Context) => {
    try {
      const { content } = await c.req.json();

      if (!content) {
        return c.json({ error: "Content is required" }, 400);
      }

      const todo = await this.createTodoUseCase.execute({ content });
      return c.json(todo, 201);
    } catch (error) {
      logger.error("Failed to create todo:", error);
      return c.json({ error: "Failed to create todo" }, 500);
    }
  };

  update = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const { content, completed } = await c.req.json();

      const todo = await this.updateTodoUseCase.execute({
        id,
        content,
        completed,
      });

      if (!todo) {
        return c.json({ error: "Todo not found" }, 404);
      }

      return c.json(todo);
    } catch (error) {
      logger.error("Failed to update todo:", error);
      return c.json({ error: "Failed to update todo" }, 500);
    }
  };

  delete = async (c: Context) => {
    try {
      const id = c.req.param("id");

      const success = await this.deleteTodoUseCase.execute(id);

      if (!success) {
        return c.json({ error: "Todo not found" }, 404);
      }

      return c.json({ success: true });
    } catch (error) {
      logger.error("Failed to delete todo:", error);
      return c.json({ error: "Failed to delete todo" }, 500);
    }
  };
}
