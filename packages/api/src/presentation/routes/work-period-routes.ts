import { vValidator } from "@hono/valibot-validator";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { IdParamSchema } from "src/schema";
import { date, object, optional, string } from "valibot";
import {
  type CreateWorkPeriodDTO,
  CreateWorkPeriodUseCase,
} from "../../application/use-cases/work-period/create-work-period";
import { DeleteWorkPeriodUseCase } from "../../application/use-cases/work-period/delete-work-period";
import { GetWorkPeriodsUseCase } from "../../application/use-cases/work-period/get-work-periods";
import {
  type UpdateWorkPeriodDTO,
  UpdateWorkPeriodUseCase,
} from "../../application/use-cases/work-period/update-work-period";
import type { TodoActivityRepository } from "../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { WorkPeriodRepository } from "../../domain/repositories/work-period-repository";
import { validate } from "../middlewares/validate";
import { WorkPeriodSchema } from "../schemas/work-period-schemas";
import { convertToResponseSchema } from "../utils/schema-converter";

const createWorkPeriodSchema = object({
  name: string(),
  date: optional(string()),
  startTime: string(),
  endTime: string(),
});

const updateWorkPeriodSchema = object({
  name: optional(string()),
  date: optional(string()),
  startTime: optional(string()),
  endTime: optional(string()),
});

/**
 * Setup API routes for Work Period features
 */
export function setupWorkPeriodRoutes<E extends Env, S extends Schema>(
  app: Hono<E, S>,
  workPeriodRepository: WorkPeriodRepository,
  todoRepository: TodoRepository,
  todoActivityRepository: TodoActivityRepository,
): Hono<E, S> {
  // Get all work periods
  app.get("/work-periods", async (c) => {
    const useCase = new GetWorkPeriodsUseCase(workPeriodRepository);
    const workPeriods = await useCase.execute();
    const response = await Promise.all(workPeriods.map((wp) => convertToResponseSchema(wp, WorkPeriodSchema)));
    return c.json(response);
  });

  // Get work period by id
  app.get("/work-periods/:id", validate("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param") as { id: string };
    const workPeriod = await workPeriodRepository.findById(id);
    if (!workPeriod) {
      return c.json({ error: "Work period not found" }, 404);
    }
    const response = await convertToResponseSchema(workPeriod, WorkPeriodSchema);
    return c.json(response);
  });

  // Create work period
  app.post("/work-periods", vValidator("json", createWorkPeriodSchema), async (c) => {
    const data = c.req.valid("json") as CreateWorkPeriodDTO;
    const useCase = new CreateWorkPeriodUseCase(workPeriodRepository);
    const workPeriod = await useCase.execute(data);
    const response = await convertToResponseSchema(workPeriod, WorkPeriodSchema);
    return c.json(response, 201);
  });

  // Update work period
  app.put(
    "/work-periods/:id",
    validate("param", IdParamSchema),
    vValidator("json", updateWorkPeriodSchema),
    async (c) => {
      const { id } = c.req.valid("param") as { id: string };
      const data = c.req.valid("json") as Omit<UpdateWorkPeriodDTO, "id">;
      const useCase = new UpdateWorkPeriodUseCase(workPeriodRepository);
      const workPeriod = await useCase.execute({ id, ...data });
      const response = await convertToResponseSchema(workPeriod, WorkPeriodSchema);
      return c.json(response);
    },
  );

  // Delete work period
  app.delete("/work-periods/:id", validate("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param") as { id: string };
    const useCase = new DeleteWorkPeriodUseCase(workPeriodRepository);
    await useCase.execute({ id });
    c.status(204);
    return c.body(null);
  });

  // Associate a todo activity with a work period
  app.post(
    "/work-periods/:id/activities/:activityId",
    validate("param", object({ id: string(), activityId: string() })),
    async (c) => {
      const { id, activityId } = c.req.valid("param") as {
        id: string;
        activityId: string;
      };

      const workPeriod = await workPeriodRepository.findById(id);
      if (!workPeriod) {
        return c.json({ error: "Work period not found" }, 404);
      }

      const activity = await todoActivityRepository.findById(activityId);
      if (!activity) {
        return c.json({ error: "Todo activity not found" }, 404);
      }

      await workPeriodRepository.addActivity(id, activityId);
      c.status(204);
      return c.body(null);
    },
  );

  // Get activities in a work period
  app.get("/work-periods/:id/activities", validate("param", IdParamSchema), async (c) => {
    const { id } = c.req.valid("param") as { id: string };
    const workPeriod = await workPeriodRepository.findById(id);
    if (!workPeriod) {
      return c.json({ error: "Work period not found" }, 404);
    }

    const activities = await workPeriodRepository.getActivities(id);
    return c.json(activities);
  });

  // Remove an activity from a work period
  app.delete(
    "/work-periods/:id/activities/:activityId",
    validate("param", object({ id: string(), activityId: string() })),
    async (c) => {
      const { id, activityId } = c.req.valid("param") as {
        id: string;
        activityId: string;
      };

      const workPeriod = await workPeriodRepository.findById(id);
      if (!workPeriod) {
        return c.json({ error: "Work period not found" }, 404);
      }

      await workPeriodRepository.removeActivity(id, activityId);
      c.status(204);
      return c.body(null);
    },
  );

  return app;
}
