import "reflect-metadata";
import { Hono } from "hono";
import { swaggerUI } from "@hono/swagger-ui";
import {
  getTaskController,
  initializeContainer,
} from "./application/services/DependencyContainer";
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

// Task API
app.get("/api/tasks", taskController.getRootTasks);
app.get("/api/tasks/:id", taskController.getTaskById);
app.post("/api/tasks", taskController.create);
app.patch("/api/tasks/:id", taskController.update);
app.delete("/api/tasks/:id", taskController.delete);
app.patch("/api/tasks/:id/move", taskController.move);
app.put("/api/tasks/reorder", taskController.reorder);
app.put("/api/tasks/:parentId/reorder", taskController.reorder);

export default app;

// For direct execution with bun run
if (import.meta.main) {
  // @ts-ignore
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001;
  console.log(`Server listening on http://localhost:${port}`);
  console.log(
    `OpenAPI documentation available at http://localhost:${port}/api/docs`
  );
  console.log(`Swagger UI available at http://localhost:${port}/swagger`);

  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
