import { Hono } from "hono";
import { DependencyContainer } from "./application/services/DependencyContainer";

const app = new Hono();
const container = new DependencyContainer();

const taskController = container.getTaskController();

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
  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
