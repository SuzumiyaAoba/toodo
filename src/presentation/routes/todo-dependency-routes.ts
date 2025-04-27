import type { ConversionConfig } from "@valibot/to-json-schema";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as vValidator } from "hono-openapi/valibot";
import { AddTodoDependencyUseCase } from "../../application/use-cases/todo-dependency/add-todo-dependency";
import { GetTodoDependenciesUseCase } from "../../application/use-cases/todo-dependency/get-todo-dependencies";
import { GetTodoDependentsUseCase } from "../../application/use-cases/todo-dependency/get-todo-dependents";
import { RemoveTodoDependencyUseCase } from "../../application/use-cases/todo-dependency/remove-todo-dependency";
import {
  DependencyCycleError,
  DependencyExistsError,
  DependencyNotFoundError,
  SelfDependencyError,
  TodoNotFoundError,
} from "../../domain/errors/todo-errors";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import {
  IdParamSchema,
  TodoDependencyListSchema,
  TodoDependencyParamSchema,
  TodoDependentListSchema,
} from "../schemas/todo-schemas";

/**
 * ConversionConfig for valibot to JSON schema
 */
const valibotConfig: ConversionConfig = {
  errorMode: "warn",
};

/**
 * Setup API routes for Todo dependencies
 */
export function setupTodoDependencyRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  todoRepository: TodoRepository,
): Hono<E, S> {
  // 依存関係を追加するエンドポイント
  app.post(
    "/todos/:id/dependencies/:dependencyId",
    describeRoute({
      tags: ["Todos", "Dependencies"],
      summary: "Add a dependency relationship",
      description: "Add a dependency where the todo with ID 'id' depends on the todo with ID 'dependencyId'",
      request: {
        params: resolver(TodoDependencyParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Dependency added successfully",
        },
        400: {
          description: "Bad request - Cannot add dependency (self-dependency, cycle, or already exists)",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", TodoDependencyParamSchema),
    async (c) => {
      const { id, dependencyId } = c.req.valid("param");
      const useCase = new AddTodoDependencyUseCase(todoRepository);

      try {
        await useCase.execute(id, dependencyId);
        c.status(204);
        return c.body(null);
      } catch (error) {
        if (error instanceof TodoNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (
          error instanceof SelfDependencyError ||
          error instanceof DependencyCycleError ||
          error instanceof DependencyExistsError
        ) {
          return c.json({ error: error.message }, 400);
        }
        throw error;
      }
    },
  );

  // 依存関係を削除するエンドポイント
  app.delete(
    "/todos/:id/dependencies/:dependencyId",
    describeRoute({
      tags: ["Todos", "Dependencies"],
      summary: "Remove a dependency relationship",
      description: "Remove a dependency where the todo with ID 'id' depends on the todo with ID 'dependencyId'",
      request: {
        params: resolver(TodoDependencyParamSchema, valibotConfig),
      },
      responses: {
        204: {
          description: "Dependency removed successfully",
        },
        400: {
          description: "Bad request - Dependency does not exist",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", TodoDependencyParamSchema),
    async (c) => {
      const { id, dependencyId } = c.req.valid("param");
      const useCase = new RemoveTodoDependencyUseCase(todoRepository);

      try {
        await useCase.execute(id, dependencyId);
        c.status(204);
        return c.body(null);
      } catch (error) {
        if (error instanceof TodoNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        if (error instanceof DependencyNotFoundError) {
          return c.json({ error: error.message }, 400);
        }
        throw error;
      }
    },
  );

  // 依存関係を取得するエンドポイント
  app.get(
    "/todos/:id/dependencies",
    describeRoute({
      tags: ["Todos", "Dependencies"],
      summary: "Get todo dependencies",
      description: "Get all todos that the specified todo depends on",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "List of dependencies",
          content: {
            "application/json": {
              schema: resolver(TodoDependencyListSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const useCase = new GetTodoDependenciesUseCase(todoRepository);

      try {
        const dependencies = await useCase.execute(id);
        const response = {
          dependencies: dependencies.map((todo) => ({
            id: todo.id,
            title: todo.title,
            status: todo.status,
            priority: todo.priority,
          })),
        };
        return c.json(response);
      } catch (error) {
        if (error instanceof TodoNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      }
    },
  );

  // 依存先を取得するエンドポイント
  app.get(
    "/todos/:id/dependents",
    describeRoute({
      tags: ["Todos", "Dependencies"],
      summary: "Get todo dependents",
      description: "Get all todos that depend on the specified todo",
      request: {
        params: resolver(IdParamSchema, valibotConfig),
      },
      responses: {
        200: {
          description: "List of dependents",
          content: {
            "application/json": {
              schema: resolver(TodoDependentListSchema, valibotConfig),
            },
          },
        },
        404: {
          description: "Todo not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: { type: "string" },
                },
              },
            },
          },
        },
      },
    }),
    vValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const useCase = new GetTodoDependentsUseCase(todoRepository);

      try {
        const dependents = await useCase.execute(id);
        const response = {
          dependents: dependents.map((todo) => ({
            id: todo.id,
            title: todo.title,
            status: todo.status,
            priority: todo.priority,
          })),
        };
        return c.json(response);
      } catch (error) {
        if (error instanceof TodoNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        throw error;
      }
    },
  );

  return app;
}
