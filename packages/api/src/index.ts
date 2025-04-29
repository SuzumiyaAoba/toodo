import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { logger } from "hono/logger";
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
import { GetTodoDependencyTreeUseCase } from "./application/use-cases/todo-dependency/get-todo-dependency-tree";
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
import { prisma } from "./infrastructure/db";
import { PrismaProjectRepository } from "./infrastructure/repositories/prisma-project-repository";
import { PrismaTagRepository } from "./infrastructure/repositories/prisma-tag-repository";
import { PrismaTodoActivityRepository } from "./infrastructure/repositories/prisma-todo-activity-repository";
import { PrismaTodoRepository } from "./infrastructure/repositories/prisma-todo-repository";
import { errorHandler } from "./presentation/middlewares/error-handler";
import { setupProjectRoutes } from "./presentation/routes/project-routes";
import { setupTagRoutes } from "./presentation/routes/tag-routes";
import { setupTodoDependencyRoutes } from "./presentation/routes/todo-dependency-routes";
import { setupTodoDueDateRoutes } from "./presentation/routes/todo-due-date-routes";
import { setupTodoRoutes } from "./presentation/routes/todo-routes";

// Initialize repositories
const todoRepository = new PrismaTodoRepository(prisma);
const todoActivityRepository = new PrismaTodoActivityRepository(prisma);
const tagRepository = new PrismaTagRepository(prisma);
const projectRepository = new PrismaProjectRepository(prisma);

// Initialize Tag use cases
const createTagUseCase = new CreateTagUseCase(tagRepository);
const getAllTagsUseCase = new GetAllTagsUseCase(tagRepository);
const getTagByIdUseCase = new GetTagByIdUseCase(tagRepository);
const updateTagUseCase = new UpdateTagUseCase(tagRepository);
const deleteTagUseCase = new DeleteTagUseCase(tagRepository);
const assignTagToTodoUseCase = new AssignTagToTodoUseCase(tagRepository, todoRepository);
const getTaggedTodosUseCase = new GetTodosByMultipleTagsUseCase(tagRepository, todoRepository);
const bulkAssignTagUseCase = new BulkAssignTagUseCase(tagRepository, todoRepository);
const bulkRemoveTagUseCase = new BulkRemoveTagUseCase(tagRepository, todoRepository);

// Initialize Todo use cases
const createTodoUseCase = new CreateTodoUseCase(todoRepository, todoActivityRepository);
const getTodoListUseCase = new GetTodoListUseCase(todoRepository);
const getTodoUseCase = new GetTodoUseCase(todoRepository);
const updateTodoUseCase = new UpdateTodoUseCase(todoRepository);
const deleteTodoUseCase = new DeleteTodoUseCase(todoRepository, todoActivityRepository);
const getTodoWorkTimeUseCase = new GetTodoWorkTimeUseCase(todoRepository);

const createTodoActivityUseCase = new CreateTodoActivityUseCase(todoRepository, todoActivityRepository);
const getTodoActivityListUseCase = new GetTodoActivityListUseCase(todoRepository, todoActivityRepository);
const deleteTodoActivityUseCase = new DeleteTodoActivityUseCase(todoRepository, todoActivityRepository);

// Initialize Todo Dependency use cases
const addTodoDependencyUseCase = new AddTodoDependencyUseCase(todoRepository);
const removeTodoDependencyUseCase = new RemoveTodoDependencyUseCase(todoRepository);
const getTodoDependenciesUseCase = new GetTodoDependenciesUseCase(todoRepository);
const getTodoDependentsUseCase = new GetTodoDependentsUseCase(todoRepository);
const getTodoDependencyTreeUseCase = new GetTodoDependencyTreeUseCase(todoRepository);

// Initialize Due Date use cases
const findOverdueTodosUseCase = new FindOverdueTodosUseCase(todoRepository);
const findDueSoonTodosUseCase = new FindDueSoonTodosUseCase(todoRepository);
const findByDueDateRangeUseCase = new FindByDueDateRangeUseCase(todoRepository);
const bulkUpdateDueDateUseCase = new BulkUpdateDueDateUseCase(todoRepository);

// Initialize Project use cases
const createProjectUseCase = new CreateProject(projectRepository);
const getAllProjectsUseCase = new GetAllProjects(projectRepository);
const getProjectUseCase = new GetProject(projectRepository);
const updateProjectUseCase = new UpdateProject(projectRepository);
const deleteProjectUseCase = new DeleteProject(projectRepository);
const getProjectTodosUseCase = new GetTodosByProject(projectRepository, todoRepository);
const assignTodoToProjectUseCase = new AddTodoToProjectUseCase(projectRepository, todoRepository);
const removeTodoFromProjectUseCase = new RemoveTodoFromProjectUseCase(projectRepository, todoRepository);

// Create Hono app
const app = new Hono();

// Add middlewares
app.use("*", logger());
app.use("*", cors());
app.use("*", secureHeaders());
app.onError((err, c) => {
  // Check for HTTPException
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  return errorHandler(err, c);
});

// Add routes
const apiBase = "/api/v1";

// Setup Todo routes
app.route(
  apiBase,
  setupTodoRoutes(
    new Hono(),
    createTodoUseCase,
    getTodoListUseCase,
    getTodoUseCase,
    updateTodoUseCase,
    deleteTodoUseCase,
    getTodoWorkTimeUseCase,
    createTodoActivityUseCase,
    getTodoActivityListUseCase,
    deleteTodoActivityUseCase,
  ),
);

// Setup Tag routes
app.route(apiBase, setupTagRoutes(new Hono(), tagRepository, todoRepository));

// Setup Todo Dependency routes
app.route(apiBase, setupTodoDependencyRoutes(new Hono(), todoRepository));

// Setup Todo Due Date routes
app.route(
  apiBase,
  setupTodoDueDateRoutes(
    new Hono(),
    findOverdueTodosUseCase,
    findDueSoonTodosUseCase,
    findByDueDateRangeUseCase,
    bulkUpdateDueDateUseCase,
  ),
);

// Setup Project routes
app.route(apiBase, setupProjectRoutes(new Hono(), projectRepository, todoRepository));

// Add health check endpoint
app.get("/health", (c) => c.text("OK"));

// Export app for testing
export default app;

// Start the server only in non-test environment
if (process.env.NODE_ENV !== "test") {
  const port = process.env.PORT || 3000;
  console.log(`Server is running on port ${port}`);

  serve({
    fetch: app.fetch,
    port: Number(port),
  });
}
