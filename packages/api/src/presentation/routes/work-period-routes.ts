import { zValidator } from "@hono/zod-validator";
import type { WorkPeriod } from "@toodo/core";
import type { Hono } from "hono";
import { z } from "zod";
import { CreateWorkPeriodUseCase } from "../../application/use-cases/work-period/create-work-period";
import type { CreateWorkPeriodDTO } from "../../application/use-cases/work-period/create-work-period";
import { GetWorkPeriodStatisticsUseCase } from "../../application/use-cases/work-period/get-work-period-statistics";
import { GetWorkPeriodsUseCase } from "../../application/use-cases/work-period/get-work-periods";
import { UpdateWorkPeriodUseCase } from "../../application/use-cases/work-period/update-work-period";
import type { UpdateWorkPeriodDTO } from "../../application/use-cases/work-period/update-work-period";
import type { TodoActivityRepository } from "../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { WorkPeriodRepository } from "../../domain/repositories/work-period-repository";

/**
 * WorkPeriodルートの設定
 */
export function setupWorkPeriodRoutes(
  app: Hono,
  workPeriodRepository: WorkPeriodRepository,
  todoRepository: TodoRepository,
  todoActivityRepository: TodoActivityRepository,
): Hono {
  // バリデーションスキーマ
  const createWorkPeriodSchema = z.object({
    name: z.string().min(1),
    date: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    startTime: z.string().transform((val) => new Date(val)),
    endTime: z.string().transform((val) => new Date(val)),
  });

  const updateWorkPeriodSchema = z.object({
    name: z.string().min(1).optional(),
    date: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    startTime: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    endTime: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
  });

  const dateRangeSchema = z.object({
    startDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
    endDate: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined)),
  });

  // 稼働時間作成
  app.post("/work-periods", zValidator("json", createWorkPeriodSchema), async (c) => {
    try {
      const data = c.req.valid("json") as CreateWorkPeriodDTO;
      const createWorkPeriodUseCase = new CreateWorkPeriodUseCase(workPeriodRepository);
      const workPeriod = await createWorkPeriodUseCase.execute(data);

      return c.json(
        {
          id: workPeriod.id,
          name: workPeriod.name,
          date: workPeriod.date,
          startTime: workPeriod.startTime,
          endTime: workPeriod.endTime,
          createdAt: workPeriod.createdAt,
          updatedAt: workPeriod.updatedAt,
        },
        201,
      );
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Failed to create work period" }, 500);
    }
  });

  // 稼働時間取得
  app.get("/work-periods", async (c) => {
    try {
      const { startDate, endDate } = c.req.query();
      const getWorkPeriodsUseCase = new GetWorkPeriodsUseCase(workPeriodRepository);

      let workPeriods: WorkPeriod[];
      if (startDate && endDate) {
        workPeriods = await getWorkPeriodsUseCase.execute({
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        });
      } else {
        workPeriods = await getWorkPeriodsUseCase.execute();
      }

      return c.json({
        workPeriods: workPeriods.map((wp) => ({
          id: wp.id,
          name: wp.name,
          date: wp.date,
          startTime: wp.startTime,
          endTime: wp.endTime,
          createdAt: wp.createdAt,
          updatedAt: wp.updatedAt,
        })),
      });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to get work periods" }, 500);
    }
  });

  // 稼働時間更新
  app.patch("/work-periods/:id", zValidator("json", updateWorkPeriodSchema), async (c) => {
    try {
      const id = c.req.param("id");
      const validData = c.req.valid("json") as z.infer<typeof updateWorkPeriodSchema>;

      const updateWorkPeriodUseCase = new UpdateWorkPeriodUseCase(workPeriodRepository);
      const updateData: UpdateWorkPeriodDTO = {
        id,
        name: validData.name,
        date: validData.date,
        startTime: validData.startTime,
        endTime: validData.endTime,
      };

      const workPeriod = await updateWorkPeriodUseCase.execute(updateData);

      return c.json({
        id: workPeriod.id,
        name: workPeriod.name,
        date: workPeriod.date,
        startTime: workPeriod.startTime,
        endTime: workPeriod.endTime,
        createdAt: workPeriod.createdAt,
        updatedAt: workPeriod.updatedAt,
      });
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Failed to update work period" }, 500);
    }
  });

  // 稼働時間削除
  app.delete("/work-periods/:id", async (c) => {
    try {
      const id = c.req.param("id");

      // アクティビティの関連を確認
      const activities = await todoActivityRepository.findByWorkPeriodId(id);
      if (activities.length > 0) {
        // アクティビティが関連している場合、ワークピリオドIDをnullに設定
        await Promise.all(activities.map((activity) => todoActivityRepository.updateWorkPeriod(activity.id, null)));
      }

      // 稼働時間を削除
      await workPeriodRepository.delete(id);

      return c.json({ success: true });
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to delete work period" }, 500);
    }
  });

  // 稼働時間統計
  app.get("/work-periods/statistics", zValidator("query", dateRangeSchema), async (c) => {
    try {
      const validData = c.req.valid("query") as z.infer<typeof dateRangeSchema>;
      const startDate = validData.startDate;
      const endDate = validData.endDate;

      const getStatisticsUseCase = new GetWorkPeriodStatisticsUseCase(workPeriodRepository);
      const statistics = await getStatisticsUseCase.execute({
        startDate,
        endDate,
      });

      return c.json(statistics);
    } catch (error) {
      console.error(error);
      return c.json({ error: "Failed to get work period statistics" }, 500);
    }
  });

  return app;
}
