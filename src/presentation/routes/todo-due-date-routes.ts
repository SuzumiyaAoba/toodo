import type { ConversionConfig } from "@valibot/to-json-schema";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import type { FindByDueDateRangeUseCase } from "../../application/use-cases/todo/due-date/find-by-due-date-range";
import type { FindDueSoonTodosUseCase } from "../../application/use-cases/todo/due-date/find-due-soon-todos";
import type { FindOverdueTodosUseCase } from "../../application/use-cases/todo/due-date/find-overdue-todos";
import {
  DueDateQuerySchema,
  DueDateRangeQuerySchema,
  ErrorResponseSchema,
  TodoListSchema,
} from "../schemas/todo-schemas";

/**
 * ConversionConfig for valibot to JSON schema
 */
const valibotConfig: ConversionConfig = {
  errorMode: "warn",
};

/**
 * Setup API routes for Todo due date features
 */
export function setupTodoDueDateRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  findOverdueTodosUseCase: FindOverdueTodosUseCase,
  findDueSoonTodosUseCase: FindDueSoonTodosUseCase,
  findByDueDateRangeUseCase: FindByDueDateRangeUseCase,
): Hono<E, S> {
  // Get overdue todos
  app.get(
    "/todos/overdue",
    describeRoute({
      tags: ["Todos", "Due Date"],
      summary: "Get overdue todos",
      description: "Retrieve a list of todos that are past their due dates and not completed",
      responses: {
        200: {
          description: "List of overdue todos",
          content: {
            "application/json": {
              schema: resolver(TodoListSchema, valibotConfig),
            },
          },
        },
      },
    }),
    async (c) => {
      const todos = await findOverdueTodosUseCase.execute();
      return c.json(todos);
    },
  );

  // Get todos due soon
  app.get(
    "/todos/due-soon",
    describeRoute({
      tags: ["Todos", "Due Date"],
      summary: "Get todos due soon",
      description: "Retrieve a list of todos that are due soon and not completed",
      request: {
        query: resolver(DueDateQuerySchema, valibotConfig),
      },
      responses: {
        200: {
          description: "List of todos due soon",
          content: {
            "application/json": {
              schema: resolver(TodoListSchema, valibotConfig),
            },
          },
        },
        400: {
          description: "Invalid request parameters",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("query", DueDateQuerySchema),
    async (c) => {
      const query = c.req.valid("query");
      const days = query.days ?? 2; // デフォルトは2日以内

      const todos = await findDueSoonTodosUseCase.execute(days);
      return c.json(todos);
    },
  );

  // Get todos by due date range
  app.get(
    "/todos/by-due-date",
    describeRoute({
      tags: ["Todos", "Due Date"],
      summary: "Get todos by due date range",
      description: "Retrieve a list of todos with due dates within the specified range",
      request: {
        query: resolver(DueDateRangeQuerySchema, valibotConfig),
      },
      responses: {
        200: {
          description: "List of todos in the due date range",
          content: {
            "application/json": {
              schema: resolver(TodoListSchema, valibotConfig),
            },
          },
        },
        400: {
          description: "Invalid request parameters",
          content: {
            "application/json": {
              schema: resolver(ErrorResponseSchema, valibotConfig),
            },
          },
        },
      },
    }),
    vValidator("query", DueDateRangeQuerySchema),
    async (c) => {
      const { startDate, endDate } = c.req.valid("query");

      // 終了日が開始日より前の場合はエラー
      if (endDate < startDate) {
        return c.json({ error: "End date must be after start date" }, 400);
      }

      const todos = await findByDueDateRangeUseCase.execute(startDate, endDate);
      return c.json(todos);
    },
  );

  return app;
}
