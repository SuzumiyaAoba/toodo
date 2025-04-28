import { vValidator } from "@hono/valibot-validator";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import type * as v from "valibot";
import type { BulkUpdateDueDateUseCase } from "../../application/use-cases/todo/due-date/bulk-update-due-date";
import type { FindByDueDateRangeUseCase } from "../../application/use-cases/todo/due-date/find-by-due-date-range";
import type { FindDueSoonTodosUseCase } from "../../application/use-cases/todo/due-date/find-due-soon-todos";
import type { FindOverdueTodosUseCase } from "../../application/use-cases/todo/due-date/find-overdue-todos";
import {
  BulkDueDateUpdateSchema,
  DueDateQuerySchema,
  DueDateRangeQuerySchema,
  ErrorResponseSchema,
  TodoListSchema,
} from "../schemas/todo-schemas";

/**
 * Setup API routes for Todo due date features
 */
export function setupTodoDueDateRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  findOverdueTodosUseCase: FindOverdueTodosUseCase,
  findDueSoonTodosUseCase: FindDueSoonTodosUseCase,
  findByDueDateRangeUseCase: FindByDueDateRangeUseCase,
  bulkUpdateDueDateUseCase: BulkUpdateDueDateUseCase,
): Hono<E, S> {
  // Get overdue todos
  app.get("/todos/overdue", async (c) => {
    const todos = await findOverdueTodosUseCase.execute();
    return c.json(todos);
  });

  // Get todos due soon
  app.get("/todos/due-soon", vValidator("query", DueDateQuerySchema), async (c) => {
    const query = c.req.valid("query") as v.InferOutput<typeof DueDateQuerySchema>;
    const days = query.days ?? 2; // Default is 2 days
    const todos = await findDueSoonTodosUseCase.execute(days);
    return c.json(todos);
  });

  // Get todos by due date range
  app.get("/todos/by-due-date", vValidator("query", DueDateRangeQuerySchema), async (c) => {
    const { startDate, endDate } = c.req.valid("query") as v.InferOutput<typeof DueDateRangeQuerySchema>;

    // Error if end date is before start date
    if (endDate < startDate) {
      return c.json({ error: "End date must be after start date" }, 400);
    }

    const todos = await findByDueDateRangeUseCase.execute(startDate, endDate);
    return c.json(todos);
  });

  // Bulk update due dates
  app.post("/todos/bulk-due-date", vValidator("json", BulkDueDateUpdateSchema), async (c) => {
    const { todoIds, dueDate } = c.req.valid("json") as v.InferOutput<typeof BulkDueDateUpdateSchema>;

    // At least one ID is required
    if (todoIds.length === 0) {
      return c.json({ error: "At least one todo ID is required" }, 400);
    }

    const updatedTodos = await bulkUpdateDueDateUseCase.execute(todoIds, dueDate);
    return c.json(updatedTodos);
  });

  return app;
}
