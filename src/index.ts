import "reflect-metadata";
import { swaggerUI } from "@hono/swagger-ui";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { getTaskController, initializeContainer } from "./application/services/DependencyContainer";
import { createTaskSchema, idSchema, paginationSchema } from "./domain/models/schema/TaskSchema";
import { openApiDocument } from "./infrastructure/openapi/openapi";

// Initialize dependency injection container
initializeContainer();

const app = new Hono();
const taskController = getTaskController();

// Swagger UI route
app.get("/swagger", swaggerUI({ url: "/api/docs" }));

// OpenAPI documentation endpoint
app.get("/api/docs", (c) => {
  return c.json(openApiDocument);
});

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Task API routes with proper validation
app.get("/api/tasks", zValidator("query", paginationSchema), taskController.getRootTasks);

app.get("/api/tasks/:id", zValidator("param", z.object({ id: idSchema })), taskController.getTaskById);

app.post("/api/tasks", zValidator("json", createTaskSchema), taskController.create);

app.patch("/api/tasks/:id", zValidator("param", z.object({ id: idSchema })), taskController.update);

app.delete("/api/tasks/:id", zValidator("param", z.object({ id: idSchema })), taskController.delete);

app.patch("/api/tasks/:id/move", zValidator("param", z.object({ id: idSchema })), taskController.move);

app.put("/api/tasks/reorder", taskController.reorder);

// Generate OpenAPI documentation
app.get("/api/docs/new", (c) => {
  return c.json({
    openapi: "3.0.0",
    info: {
      title: "Toodo API",
      version: "1.0.0",
      description: "Toodo application API documentation",
    },
    paths: {
      // APIパスの定義はopenApiDocumentと同期を保つこと
    },
  });
});

export default app;

// For direct execution with bun run
if (import.meta.main) {
  // @ts-expect-error Bun環境のため
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001;
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`OpenAPI documentation available at http://localhost:${port}/api/docs`);
  console.log(`Swagger UI available at http://localhost:${port}/swagger`);
  console.log(`New OpenAPI documentation available at http://localhost:${port}/api/docs/new`);

  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
