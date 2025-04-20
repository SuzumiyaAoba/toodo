import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { openAPISpecs } from "hono-openapi";
import { PrismaClient } from "./generated/prisma";
import { errorHandler } from "./presentation/middlewares/error-handler";
import { setupRoutes } from "./presentation/routes";

import { TodoActivityController } from "./presentation/controllers/todo-activity-controller";
// Controllers
import { TodoController } from "./presentation/controllers/todo-controller";

import { CreateTodoActivityUseCase } from "./application/use-cases/todo-activity/create-todo-activity";
import { DeleteTodoActivityUseCase } from "./application/use-cases/todo-activity/delete-todo-activity";
import { GetTodoActivityListUseCase } from "./application/use-cases/todo-activity/get-todo-activity-list";
// Use Cases
import { CreateTodoUseCase } from "./application/use-cases/todo/create-todo";
import { DeleteTodoUseCase } from "./application/use-cases/todo/delete-todo";
import { GetTodoUseCase } from "./application/use-cases/todo/get-todo";
import { GetTodoListUseCase } from "./application/use-cases/todo/get-todo-list";
import { GetTodoWorkTimeUseCase } from "./application/use-cases/todo/get-todo-work-time";
import { UpdateTodoUseCase } from "./application/use-cases/todo/update-todo";

import { PrismaTodoActivityRepository } from "./infrastructure/repositories/prisma-todo-activity-repository";
// Repositories
import { PrismaTodoRepository } from "./infrastructure/repositories/prisma-todo-repository";

// Create app instance
const app = new Hono();

// Apply global error handler
app.use("*", errorHandler);

// Setup OpenAPI
app.get(
  "/openapi",
  openAPISpecs(app, {
    documentation: {
      info: {
        title: "Toodo API",
        version: "1.0.0",
        description: "API for managing TODO items",
      },
      servers: [{ url: "http://localhost:3000", description: "Local Server" }],
    },
  }),
);

// Setup Scalar UI
app.get(
  "/scalar",
  Scalar({
    theme: "saturn",
    spec: { url: "/openapi" },
  }),
);

// Initialize database
const prisma = new PrismaClient();

// Initialize repositories
const todoRepository = new PrismaTodoRepository(prisma);
const todoActivityRepository = new PrismaTodoActivityRepository(prisma);

// Initialize use cases
const createTodoUseCase = new CreateTodoUseCase(todoRepository);
const getTodoListUseCase = new GetTodoListUseCase(todoRepository);
const getTodoUseCase = new GetTodoUseCase(todoRepository);
const updateTodoUseCase = new UpdateTodoUseCase(todoRepository);
const deleteTodoUseCase = new DeleteTodoUseCase(todoRepository, todoActivityRepository);
const getTodoWorkTimeUseCase = new GetTodoWorkTimeUseCase(todoRepository);

const createTodoActivityUseCase = new CreateTodoActivityUseCase(todoRepository, todoActivityRepository);
const getTodoActivityListUseCase = new GetTodoActivityListUseCase(todoRepository, todoActivityRepository);
const deleteTodoActivityUseCase = new DeleteTodoActivityUseCase(todoRepository, todoActivityRepository);

// Initialize controllers
const todoController = new TodoController(
  createTodoUseCase,
  getTodoListUseCase,
  getTodoUseCase,
  updateTodoUseCase,
  deleteTodoUseCase,
  getTodoWorkTimeUseCase,
);

const todoActivityController = new TodoActivityController(
  createTodoActivityUseCase,
  getTodoActivityListUseCase,
  deleteTodoActivityUseCase,
);

// Setup routes
const routes = setupRoutes(todoController, todoActivityController);
app.route("/", routes);

// Export app
export default app;
