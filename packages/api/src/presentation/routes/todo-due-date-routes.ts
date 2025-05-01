import { vValidator } from "@hono/valibot-validator";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { array, object, string } from "valibot";
import { BulkUpdateDueDateUseCase } from "../../application/use-cases/todo/due-date/bulk-update-due-date";
import { FindByDueDateRangeUseCase } from "../../application/use-cases/todo/due-date/find-by-due-date-range";
import { FindDueSoonTodosUseCase } from "../../application/use-cases/todo/due-date/find-due-soon-todos";
import { FindOverdueTodosUseCase } from "../../application/use-cases/todo/due-date/find-overdue-todos";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { TodoRepository } from "../../domain/repositories/todo-repository";

const updateTodoDueDateSchema = object({
  dueDate: string(),
});

const updateTodosDueDateSchema = object({
  todoIds: array(string()),
  dueDate: string(),
});

const dueDateRangeQuerySchema = object({
  startDate: string(),
  endDate: string(),
});

type DueDateRangeQuery = {
  startDate: string;
  endDate: string;
};

type UpdateTodoDueDateBody = {
  dueDate: string;
};

type UpdateTodosDueDateBody = {
  todoIds: string[];
  dueDate: string;
};

/**
 * Setup API routes for Todo due date features
 */
export function setupTodoDueDateRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  todoRepository: TodoRepository,
): Hono<E, S> {
  // Get overdue todos
  app.get("/todos/overdue", async (c) => {
    try {
      const findOverdueTodosUseCase = new FindOverdueTodosUseCase(todoRepository);
      const todos = await findOverdueTodosUseCase.execute();
      return c.json(todos);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to get overdue todos" }, 500);
    }
  });

  // Get todos due soon
  app.get("/todos/due-soon", async (c) => {
    try {
      const findDueSoonTodosUseCase = new FindDueSoonTodosUseCase(todoRepository);
      const todos = await findDueSoonTodosUseCase.execute(7);
      return c.json(todos);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to get todos due soon" }, 500);
    }
  });

  // Get todos by due date range
  app.get("/todos/due-date/range", vValidator("query", dueDateRangeQuerySchema), async (c) => {
    try {
      const { startDate, endDate } = c.req.valid("query") as DueDateRangeQuery;
      const startDateTime = new Date(startDate);
      const endDateTime = new Date(endDate);

      if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
        return c.json({ error: "Invalid date format" }, 400);
      }

      const findByDueDateRangeUseCase = new FindByDueDateRangeUseCase(todoRepository);
      const todos = await findByDueDateRangeUseCase.execute(startDateTime, endDateTime);

      return c.json(todos);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to get todos by due date range" }, 500);
    }
  });

  // Update todo due date
  app.put("/todos/:id/due-date", vValidator("json", updateTodoDueDateSchema), async (c) => {
    try {
      const todoId = c.req.param("id");
      const { dueDate } = c.req.valid("json") as UpdateTodoDueDateBody;

      const todo = await todoRepository.findById(todoId);
      if (!todo) {
        return c.json({ error: "Todo not found" }, 404);
      }

      const updatedTodo = await todoRepository.update(todoId, {
        dueDate: new Date(dueDate),
      });

      return c.json(updatedTodo);
    } catch (error) {
      console.error(error);
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: "Failed to update todo due date" }, 500);
    }
  });

  // Bulk update todo due dates
  app.patch("/todos/due-date/bulk", vValidator("json", updateTodosDueDateSchema), async (c) => {
    try {
      const { todoIds, dueDate } = c.req.valid("json") as UpdateTodosDueDateBody;

      const bulkUpdateDueDateUseCase = new BulkUpdateDueDateUseCase(todoRepository);
      const updatedTodos = await bulkUpdateDueDateUseCase.execute(todoIds, new Date(dueDate));

      return c.json(updatedTodos);
    } catch (error) {
      console.error(error);
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Failed to update todo due dates" }, 500);
    }
  });

  return app;
}
