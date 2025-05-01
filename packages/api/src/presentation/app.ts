import { serveStatic } from "@hono/node-server/serve-static";
import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { CreateTodoActivityUseCase } from "../application/use-cases/todo-activity/create-todo-activity";
import { DeleteTodoActivityUseCase } from "../application/use-cases/todo-activity/delete-todo-activity";
import { GetTodoActivityListUseCase } from "../application/use-cases/todo-activity/get-todo-activity-list";
import { AddSubtaskUseCase } from "../application/use-cases/todo/add-subtask";
// UseCase imports
import { CreateTodoUseCase } from "../application/use-cases/todo/create-todo";
import { DeleteTodoUseCase } from "../application/use-cases/todo/delete-todo";
import { GetSubtasksUseCase } from "../application/use-cases/todo/get-subtasks";
import { GetTodoUseCase } from "../application/use-cases/todo/get-todo";
import { GetTodoListUseCase } from "../application/use-cases/todo/get-todo-list";
import { GetTodoWorkTimeUseCase } from "../application/use-cases/todo/get-todo-work-time";
import { RemoveSubtaskUseCase } from "../application/use-cases/todo/remove-subtask";
import { UpdateTodoUseCase } from "../application/use-cases/todo/update-todo";
import { PrismaClient } from "../generated/prisma";
import { PrismaProjectRepository } from "../infrastructure/repositories/prisma-project-repository";
import { PrismaTagRepository } from "../infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoActivityRepository } from "../infrastructure/repositories/prisma-todo-activity-repository";
import { PrismaTodoRepository } from "../infrastructure/repositories/prisma-todo-repository";
import { TodoDependencyRepository } from "../infrastructure/repositories/todo-dependency-repository";
import { WorkPeriodRepository } from "../infrastructure/repositories/work-period-repository";
import { corsMiddleware } from "./middlewares/cors-middleware";
import { errorHandler } from "./middlewares/error-handler";
import { setupProjectRoutes } from "./routes/project-routes";
import { setupTagBulkRoutes } from "./routes/tag-bulk-routes";
import { setupTagRoutes } from "./routes/tag-routes";
import { setupTodoActivityRoutes } from "./routes/todo-activity-routes";
import { setupTodoDependencyRoutes } from "./routes/todo-dependency-routes";
import { setupTodoDueDateRoutes } from "./routes/todo-due-date-routes";
import { setupTodoRoutes } from "./routes/todo-routes";
import { setupWorkPeriodRoutes } from "./routes/work-period-routes";

/**
 * Honoアプリケーションを設定する関数
 */
export function createApp() {
  const app = new Hono();
  const prisma = new PrismaClient();

  // リポジトリのインスタンスを作成
  const todoRepository = new PrismaTodoRepository(prisma);
  const projectRepository = new PrismaProjectRepository(prisma);
  const tagRepository = new PrismaTagRepository(prisma);
  const todoActivityRepository = new PrismaTodoActivityRepository(prisma);
  const todoDependencyRepository = new TodoDependencyRepository(prisma);
  const workPeriodRepository = new WorkPeriodRepository(prisma);

  // UseCaseのインスタンスを作成
  const createTodoUseCase = new CreateTodoUseCase(todoRepository, todoActivityRepository);
  const getTodoListUseCase = new GetTodoListUseCase(todoRepository);
  const getTodoUseCase = new GetTodoUseCase(todoRepository, tagRepository);
  const updateTodoUseCase = new UpdateTodoUseCase(todoRepository);
  const deleteTodoUseCase = new DeleteTodoUseCase(todoRepository, todoActivityRepository);
  const getTodoWorkTimeUseCase = new GetTodoWorkTimeUseCase(todoRepository);
  const createTodoActivityUseCase = new CreateTodoActivityUseCase(todoRepository, todoActivityRepository);
  const getTodoActivityListUseCase = new GetTodoActivityListUseCase(todoRepository, todoActivityRepository);
  const deleteTodoActivityUseCase = new DeleteTodoActivityUseCase(todoRepository, todoActivityRepository);
  const addSubtaskUseCase = new AddSubtaskUseCase(todoRepository);
  const getSubtasksUseCase = new GetSubtasksUseCase(todoRepository);
  const removeSubtaskUseCase = new RemoveSubtaskUseCase(todoRepository);

  // エラーハンドリングミドルウェアの設定
  app.onError(errorHandler);

  // CORSの設定
  app.use("*", corsMiddleware);

  // API Documentation
  app.get(
    "/api/docs/*",
    Scalar({
      url: "/doc",
      theme: "default",
    }),
  );

  // Static files
  app.use("/assets/*", serveStatic({ root: "./public" }));

  // APIルートの設定
  const api = new Hono().basePath("/api");

  setupTodoRoutes(
    api,
    createTodoUseCase,
    getTodoListUseCase,
    getTodoUseCase,
    updateTodoUseCase,
    deleteTodoUseCase,
    getTodoWorkTimeUseCase,
    createTodoActivityUseCase,
    getTodoActivityListUseCase,
    deleteTodoActivityUseCase,
    addSubtaskUseCase,
    getSubtasksUseCase,
    removeSubtaskUseCase,
  );
  setupProjectRoutes(api, projectRepository, todoRepository);
  setupTagRoutes(api, tagRepository, todoRepository);
  setupTagBulkRoutes(api, tagRepository, todoRepository);
  setupTodoActivityRoutes(api, todoActivityRepository, todoRepository);
  setupTodoDependencyRoutes(api, todoRepository);
  setupWorkPeriodRoutes(api, workPeriodRepository, todoRepository, todoActivityRepository);
  setupTodoDueDateRoutes(api, todoRepository);

  app.route("", api);

  return app;
}
