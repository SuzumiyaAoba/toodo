import { zValidator } from "@hono/zod-validator";
import type { Hono } from "hono";
import { z } from "zod";
import { AssignActivityToWorkPeriodUseCase } from "../../application/use-cases/todo-activity/assign-activity-to-work-period";
import { CreateTodoActivityUseCase } from "../../application/use-cases/todo-activity/create-todo-activity";
import { DeleteTodoActivityUseCase } from "../../application/use-cases/todo-activity/delete-todo-activity";
import { GetTodoActivityListUseCase } from "../../application/use-cases/todo-activity/get-todo-activity-list";
import { UnassignActivityFromWorkPeriodUseCase } from "../../application/use-cases/todo-activity/unassign-activity-from-work-period";
import { TodoNotFoundError } from "../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import { prisma } from "../../infrastructure/db";
import { WorkPeriodRepository } from "../../infrastructure/repositories/work-period-repository";
import { errorHandler } from "../middlewares/error-handler";
import { CreateTodoActivitySchema, TodoActivityListSchema } from "../schemas/todo-schemas";

const todoActivitySchema = z.object({
  type: z.string(),
  note: z.string().optional(),
});

/**
 * TodoActivityルートの設定
 */
export const setupTodoActivityRoutes = (
  app: Hono,
  todoActivityRepository: TodoActivityRepository,
  todoRepository: TodoRepository,
) => {
  // アクティビティ作成
  app.post("/todos/:todoId/activities", zValidator("json", todoActivitySchema), async (c) => {
    try {
      const todoId = c.req.param("todoId");
      const data = await c.req.json();

      const useCase = new CreateTodoActivityUseCase(todoRepository, todoActivityRepository);
      const activity = await useCase.execute(todoId, data);
      return c.json(activity, 201);
    } catch (error) {
      console.error(error);
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: "Todo not found" }, 404);
      }
      return c.json({ error: "Failed to create activity" }, 500);
    }
  });

  // アクティビティ一覧取得
  app.get("/todos/:todoId/activities", async (c) => {
    try {
      const todoId = c.req.param("todoId");
      const useCase = new GetTodoActivityListUseCase(todoRepository, todoActivityRepository);
      const activities = await useCase.execute(todoId);
      return c.json(activities);
    } catch (error) {
      console.error(error);
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: "Todo not found" }, 404);
      }
      return c.json({ error: "Failed to get activities" }, 500);
    }
  });

  // アクティビティ削除
  app.delete("/todos/:todoId/activities/:activityId", async (c) => {
    try {
      const todoId = c.req.param("todoId");
      const activityId = c.req.param("activityId");
      const useCase = new DeleteTodoActivityUseCase(todoRepository, todoActivityRepository);
      await useCase.execute(todoId, activityId);
      return c.json({ message: "Activity deleted successfully" });
    } catch (error) {
      console.error(error);
      if (error instanceof TodoNotFoundError) {
        return c.json({ error: "Todo not found" }, 404);
      }
      return c.json({ error: "Failed to delete activity" }, 500);
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
};
