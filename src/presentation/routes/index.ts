import type { ConversionConfig } from "@valibot/to-json-schema";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import type { PrismaClient } from "../../generated/prisma";
import { PrismaProjectRepository } from "../../infrastructure/repositories/prisma-project-repository";
import { PrismaTagRepository } from "../../infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoRepository } from "../../infrastructure/repositories/prisma-todo-repository";
import { setupProjectRoutes } from "./project-routes";
import { setupTagRoutes } from "./tag-routes";
import { setupTodoDependencyRoutes } from "./todo-dependency-routes";
import { setupTodoDueDateRoutes } from "./todo-due-date-routes";
import { setupTodoRoutes } from "./todo-routes";

// Todo, TodoActivity, TodoDependency の型インポート
import type { CreateTodoActivityUseCase } from "../../application/use-cases/todo-activity/create-todo-activity";
import type { DeleteTodoActivityUseCase } from "../../application/use-cases/todo-activity/delete-todo-activity";
import type { GetTodoActivityListUseCase } from "../../application/use-cases/todo-activity/get-todo-activity-list";
import type { AddTodoDependencyUseCase } from "../../application/use-cases/todo-dependency/add-todo-dependency";
import type { GetTodoDependenciesUseCase } from "../../application/use-cases/todo-dependency/get-todo-dependencies";
import type { GetTodoDependentsUseCase } from "../../application/use-cases/todo-dependency/get-todo-dependents";
import type { RemoveTodoDependencyUseCase } from "../../application/use-cases/todo-dependency/remove-todo-dependency";
import type { CreateTodoUseCase } from "../../application/use-cases/todo/create-todo";
import type { DeleteTodoUseCase } from "../../application/use-cases/todo/delete-todo";
import type { FindByDueDateRangeUseCase } from "../../application/use-cases/todo/due-date/find-by-due-date-range";
import type { FindDueSoonTodosUseCase } from "../../application/use-cases/todo/due-date/find-due-soon-todos";
import type { FindOverdueTodosUseCase } from "../../application/use-cases/todo/due-date/find-overdue-todos";
import type { GetTodoUseCase } from "../../application/use-cases/todo/get-todo";
import type { GetTodoListUseCase } from "../../application/use-cases/todo/get-todo-list";
import type { GetTodoWorkTimeUseCase } from "../../application/use-cases/todo/get-todo-work-time";
import type { UpdateTodoUseCase } from "../../application/use-cases/todo/update-todo";

/**
 * valibot to JSON schema conversion config
 */
const valibotConfig: ConversionConfig = {
  errorMode: "warn",
};

/**
 * Setup API routes for the Todo application
 * @param app - Hono application instance
 * @returns Hono application instance with routes configured
 */
export function setupRoutes<E extends Env = Env, S extends Schema = Schema>(
  app: Hono<E, S>,
  // Todo use cases
  createTodoUseCase: CreateTodoUseCase,
  getTodoListUseCase: GetTodoListUseCase,
  getTodoUseCase: GetTodoUseCase,
  updateTodoUseCase: UpdateTodoUseCase,
  deleteTodoUseCase: DeleteTodoUseCase,
  getTodoWorkTimeUseCase: GetTodoWorkTimeUseCase,
  // TodoActivity use cases
  createTodoActivityUseCase: CreateTodoActivityUseCase,
  getTodoActivityListUseCase: GetTodoActivityListUseCase,
  deleteTodoActivityUseCase: DeleteTodoActivityUseCase,
  // TodoDependency use cases
  addTodoDependencyUseCase: AddTodoDependencyUseCase,
  removeTodoDependencyUseCase: RemoveTodoDependencyUseCase,
  getTodoDependenciesUseCase: GetTodoDependenciesUseCase,
  getTodoDependentsUseCase: GetTodoDependentsUseCase,
  // TodoDueDate use cases
  findOverdueTodosUseCase: FindOverdueTodosUseCase,
  findDueSoonTodosUseCase: FindDueSoonTodosUseCase,
  findByDueDateRangeUseCase: FindByDueDateRangeUseCase,
  // PrismaClient for repositories
  prisma: PrismaClient,
): Hono<E, S> {
  // リポジトリの初期化
  const todoRepository = new PrismaTodoRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  const projectRepository = new PrismaProjectRepository(prisma);

  // ルートのセットアップ
  // 1. Todoとその関連アクティビティルート
  setupTodoRoutes<E, S>(
    app,
    createTodoUseCase,
    getTodoListUseCase,
    getTodoUseCase,
    updateTodoUseCase,
    deleteTodoUseCase,
    getTodoWorkTimeUseCase,
    createTodoActivityUseCase,
    getTodoActivityListUseCase,
    deleteTodoActivityUseCase,
  );

  // 2. Todoの依存関係ルート
  setupTodoDependencyRoutes<E, S>(app, todoRepository);

  // 3. タグ関連ルート
  setupTagRoutes<E, S>(app, tagRepository, todoRepository);

  // 4. プロジェクト関連ルート
  setupProjectRoutes<E, S>(app, projectRepository, todoRepository);

  // 5. 期限日関連ルート
  setupTodoDueDateRoutes<E, S>(app, findOverdueTodosUseCase, findDueSoonTodosUseCase, findByDueDateRangeUseCase);

  return app;
}
