import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { showRoutes } from "hono/dev";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { AddTodoToProjectUseCase } from "./application/use-cases/project/add-todo-to-project";
import { CreateProject } from "./application/use-cases/project/create-project";
import { DeleteProject } from "./application/use-cases/project/delete-project";
import { GetAllProjects } from "./application/use-cases/project/get-all-projects";
import { GetProject } from "./application/use-cases/project/get-project";
import { GetTodosByProject } from "./application/use-cases/project/get-todos-by-project";
import { RemoveTodoFromProjectUseCase } from "./application/use-cases/project/remove-todo-from-project";
import { UpdateProject } from "./application/use-cases/project/update-project";
import { BulkAssignTagUseCase, BulkRemoveTagUseCase } from "./application/use-cases/tag/bulk-tag-operations";
import { CreateTagUseCase } from "./application/use-cases/tag/create-tag";
import { DeleteTagUseCase } from "./application/use-cases/tag/delete-tag";
import { GetAllTagsUseCase } from "./application/use-cases/tag/get-tag";
import { GetTagByIdUseCase } from "./application/use-cases/tag/get-tag";
import { GetTodosByMultipleTagsUseCase } from "./application/use-cases/tag/get-todos-by-multiple-tags";
import { AssignTagToTodoUseCase } from "./application/use-cases/tag/todo-tag";
import { UpdateTagUseCase } from "./application/use-cases/tag/update-tag";
import { CreateTodoActivityUseCase } from "./application/use-cases/todo-activity/create-todo-activity";
import { DeleteTodoActivityUseCase } from "./application/use-cases/todo-activity/delete-todo-activity";
import { GetTodoActivityListUseCase } from "./application/use-cases/todo-activity/get-todo-activity-list";
import { AddTodoDependencyUseCase } from "./application/use-cases/todo-dependency/add-todo-dependency";
import { GetTodoDependenciesUseCase } from "./application/use-cases/todo-dependency/get-todo-dependencies";
import { GetTodoDependentsUseCase } from "./application/use-cases/todo-dependency/get-todo-dependents";
import { RemoveTodoDependencyUseCase } from "./application/use-cases/todo-dependency/remove-todo-dependency";
import { CreateTodoUseCase } from "./application/use-cases/todo/create-todo";
import { DeleteTodoUseCase } from "./application/use-cases/todo/delete-todo";
import { BulkUpdateDueDateUseCase } from "./application/use-cases/todo/due-date/bulk-update-due-date";
import { FindByDueDateRangeUseCase } from "./application/use-cases/todo/due-date/find-by-due-date-range";
import { FindDueSoonTodosUseCase } from "./application/use-cases/todo/due-date/find-due-soon-todos";
import { FindOverdueTodosUseCase } from "./application/use-cases/todo/due-date/find-overdue-todos";
import { GetTodoUseCase } from "./application/use-cases/todo/get-todo";
import { GetTodoListUseCase } from "./application/use-cases/todo/get-todo-list";
import { GetTodoWorkTimeUseCase } from "./application/use-cases/todo/get-todo-work-time";
import { UpdateTodoUseCase } from "./application/use-cases/todo/update-todo";
import { PrismaClient } from "./generated/prisma";
import { prisma } from "./infrastructure/db";
import { PrismaProjectRepository } from "./infrastructure/repositories/prisma-project-repository";
import { PrismaTagRepository } from "./infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoActivityRepository } from "./infrastructure/repositories/prisma-todo-activity-repository";
import { PrismaTodoRepository } from "./infrastructure/repositories/prisma-todo-repository";
import { WorkPeriodRepository } from "./infrastructure/repositories/work-period-repository";
import { errorHandler } from "./presentation/middlewares/error-handler";
import { setupProjectRoutes } from "./presentation/routes/project-routes";
import { subtaskRoutes } from "./presentation/routes/subtask-routes";
import { setupTagBulkRoutes } from "./presentation/routes/tag-bulk-routes";
import { setupTagRoutes } from "./presentation/routes/tag-routes";
import { setupTodoActivityRoutes } from "./presentation/routes/todo-activity-routes";
import { setupTodoDependencyRoutes } from "./presentation/routes/todo-dependency-routes";
import { setupTodoDueDateRoutes } from "./presentation/routes/todo-due-date-routes";
import { setupTodoRoutes } from "./presentation/routes/todo-routes";
import { setupWorkPeriodRoutes } from "./presentation/routes/work-period-routes";

const app = new Hono();
const apiV1 = new Hono();

// グローバルミドルウェアの設定
app.use("*", logger());
app.use("*", prettyJSON());
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  }),
);
app.use("*", secureHeaders());

// エラーハンドラーの設定
app.onError(errorHandler);
apiV1.onError(errorHandler);

const prismaClient = new PrismaClient();
const tagRepository = new PrismaTagRepository(prismaClient);
const todoRepository = new PrismaTodoRepository(prismaClient);
const projectRepository = new PrismaProjectRepository(prismaClient);
const todoActivityRepository = new PrismaTodoActivityRepository(prismaClient);
const workPeriodRepository = new WorkPeriodRepository(prismaClient);

// Todo use cases
const createTodoUseCase = new CreateTodoUseCase(todoRepository, todoActivityRepository);
const getTodoListUseCase = new GetTodoListUseCase(todoRepository);
const getTodoUseCase = new GetTodoUseCase(todoRepository, tagRepository);
const updateTodoUseCase = new UpdateTodoUseCase(todoRepository);
const deleteTodoUseCase = new DeleteTodoUseCase(todoRepository, todoActivityRepository);
const getTodoWorkTimeUseCase = new GetTodoWorkTimeUseCase(todoRepository);

// TodoActivity use cases
const createTodoActivityUseCase = new CreateTodoActivityUseCase(todoRepository, todoActivityRepository);
const getTodoActivityListUseCase = new GetTodoActivityListUseCase(todoRepository, todoActivityRepository);
const deleteTodoActivityUseCase = new DeleteTodoActivityUseCase(todoRepository, todoActivityRepository);

// ベースとなるTodoルートの設定
setupTodoRoutes(
  apiV1,
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

// Todo関連の拡張ルートの設定
setupTodoActivityRoutes(apiV1, todoActivityRepository, todoRepository);
setupTodoDependencyRoutes(apiV1, todoRepository);
setupTodoDueDateRoutes(apiV1, todoRepository);
apiV1.route("/todos", subtaskRoutes);

// タグ関連のルートの設定
setupTagRoutes(apiV1, tagRepository, todoRepository);
setupTagBulkRoutes(apiV1, tagRepository, todoRepository);

// プロジェクト関連のルートの設定
setupProjectRoutes(apiV1, projectRepository, todoRepository);

// 作業期間関連のルートの設定
setupWorkPeriodRoutes(apiV1, workPeriodRepository, todoRepository, todoActivityRepository);

// APIルートのマウント
app.route("/api/v1", apiV1);

// Swagger UIの設定
app.get(
  "/swagger",
  swaggerUI({
    url: "/api/docs",
  }),
);

showRoutes(app);

export default app;

const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port: Number(port),
});
