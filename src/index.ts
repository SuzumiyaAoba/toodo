import { Hono } from "hono";
import { Logger } from "tslog";
import { AppContainer } from "./app-container";

const logger = new Logger({ name: "api" });
const app = new Hono();
const container = new AppContainer();

const todoController = container.getTodoController();
const subtaskController = container.getSubtaskController();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// Todo API
app.get("/api/todos", todoController.getAll);
app.post("/api/todos", todoController.create);
app.patch("/api/todos/:id", todoController.update);
app.delete("/api/todos/:id", todoController.delete);

// Subtask API
app.get("/api/todos/:todoId/subtasks", subtaskController.getByTodoId);
app.post("/api/todos/:todoId/subtasks", subtaskController.add);
app.put("/api/subtasks/:id", subtaskController.update);
app.delete("/api/subtasks/:id", subtaskController.delete);
app.put("/api/todos/:todoId/subtasks/reorder", subtaskController.reorder);

export default app;

// For direct execution with bun run
if (import.meta.main) {
  const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3001;
  console.log(`Server listening on http://localhost:${port}`);
  Bun.serve({
    port,
    fetch: app.fetch,
  });
}
