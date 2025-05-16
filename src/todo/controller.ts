import { Context } from "hono";
import { Logger } from "tslog";
import { TodoUseCases, CreateTodoDTO, UpdateTodoDTO } from "./usecases";

// Create a logger instance
const logger = new Logger({ name: "TodoController" });

/**
 * Controller handling HTTP requests related to Todos
 * Acts as part of the infrastructure layer to bridge HTTP requests with application layer use cases
 */
export class TodoController {
  /**
   * Constructor for TodoController class
   * @param todoUseCases Implementation of Todo use cases
   */
  constructor(private todoUseCases: TodoUseCases) {}

  /**
   * Endpoint handler for retrieving all Todos
   * GET /api/todos
   */
  getAll = async (c: Context) => {
    try {
      const todos = await this.todoUseCases.getAllTodos();
      return c.json(todos);
    } catch (error) {
      logger.error("Failed to get todos:", error);
      return c.json({ error: "Failed to get todos" }, 500);
    }
  };

  /**
   * Endpoint handler for creating a new Todo
   * POST /api/todos
   */
  create = async (c: Context) => {
    try {
      const { content } = await c.req.json();

      if (!content) {
        return c.json({ error: "Content is required" }, 400);
      }

      const dto: CreateTodoDTO = { content };
      const todo = await this.todoUseCases.createTodo(dto);
      return c.json(todo, 201);
    } catch (error) {
      logger.error("Failed to create todo:", error);
      return c.json({ error: "Failed to create todo" }, 500);
    }
  };

  /**
   * Endpoint handler for updating an existing Todo
   * PATCH /api/todos/:id
   */
  update = async (c: Context) => {
    try {
      const id = c.req.param("id");
      const { content, completed } = await c.req.json();

      const dto: UpdateTodoDTO = {
        id,
        content,
        completed,
      };

      const todo = await this.todoUseCases.updateTodo(dto);

      if (!todo) {
        return c.json({ error: "Todo not found" }, 404);
      }

      return c.json(todo);
    } catch (error) {
      logger.error("Failed to update todo:", error);
      return c.json({ error: "Failed to update todo" }, 500);
    }
  };

  /**
   * Endpoint handler for deleting a Todo
   * DELETE /api/todos/:id
   */
  delete = async (c: Context) => {
    try {
      const id = c.req.param("id");

      const success = await this.todoUseCases.deleteTodo(id);

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
