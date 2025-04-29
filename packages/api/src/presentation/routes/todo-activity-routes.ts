import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { AssignActivityToWorkPeriodUseCase } from "../../application/use-cases/todo-activity/assign-activity-to-work-period";
import { CreateTodoActivityUseCase } from "../../application/use-cases/todo-activity/create-todo-activity";
import { UnassignActivityFromWorkPeriodUseCase } from "../../application/use-cases/todo-activity/unassign-activity-from-work-period";
import type { TodoActivityRepository } from "../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import { prisma } from "../../infrastructure/db";
import { WorkPeriodRepository } from "../../infrastructure/repositories/work-period-repository";
import { errorHandler } from "../middlewares/error-handler";
import { CreateTodoActivitySchema, TodoActivityListSchema } from "../schemas/todo-schemas";

/**
 * TodoActivityルートの設定
 */
export function setupTodoActivityRoutes(
  app: Hono,
  todoActivityRepository: TodoActivityRepository,
  todoRepository: TodoRepository,
): Hono {
  // アクティビティ作成
  app.post("/todos/:todoId/activities", async (c) => {
    try {
      const todoId = c.req.param("todoId");
      const data = await c.req.json();

      // 実装はダミー
      return c.json({ id: "dummy-id", todoId, ...data }, 201);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to create activity" }, 500);
    }
  });

  // アクティビティ取得
  app.get("/todos/:todoId/activities", async (c) => {
    try {
      const todoId = c.req.param("todoId");
      // TODO: 実装する
      return c.json({ activities: [] });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to get activities" }, 500);
    }
  });

  // アクティビティを稼働時間に関連付け
  const workPeriodSchema = z.object({
    workPeriodId: z.string(),
  });

  type WorkPeriodInput = z.infer<typeof workPeriodSchema>;

  app.post("/todos/activities/:id/work-period", zValidator("json", workPeriodSchema), async (c) => {
    try {
      const activityId = c.req.param("id");
      const data = c.req.valid("json") as WorkPeriodInput;

      const workPeriodRepository = new WorkPeriodRepository(prisma);
      const useCase = new AssignActivityToWorkPeriodUseCase(todoActivityRepository, workPeriodRepository);

      const result = await useCase.execute({
        activityId,
        workPeriodId: data.workPeriodId,
      });

      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });

  // アクティビティと稼働時間の関連を解除
  app.delete("/todos/activities/:id/work-period", async (c) => {
    try {
      const activityId = c.req.param("id");

      const useCase = new UnassignActivityFromWorkPeriodUseCase(todoActivityRepository);

      const result = await useCase.execute({ activityId });

      return c.json(result);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
    }
  });

  return app;
}
