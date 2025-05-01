import { vValidator } from "@hono/valibot-validator";
import type { Hono } from "hono";
import type { Env, Schema } from "hono";
import { IdParamSchema } from "src/schema";
import { object, optional, string } from "valibot";
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
import { TodoActivityNotFoundError } from "../../domain/errors/todo-errors";
import { WorkPeriodNotFoundError } from "../../domain/errors/work-period-errors";
import type { TodoActivityRepository } from "../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../domain/repositories/todo-repository";
import type { WorkPeriodRepository } from "../../domain/repositories/work-period-repository";
import { validate } from "../middlewares/validate";

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
    try {
      const useCase = new GetWorkPeriodsUseCase(workPeriodRepository);
      const workPeriods = await useCase.execute();
      const response = workPeriods.map((wp) => ({
        id: wp.id,
        name: wp.name,
        date: wp.date?.toISOString(),
        startTime: wp.startTime.toISOString(),
        endTime: wp.endTime.toISOString(),
        createdAt: wp.createdAt.toISOString(),
        updatedAt: wp.updatedAt.toISOString(),
        activities:
          wp.activities?.map((a) => ({
            id: a.id,
            type: a.type,
            note: a.note,
            createdAt: a.createdAt.toISOString(),
          })) || [],
      }));
      return c.json(response);
    } catch (error) {
      return c.json({ error: "Failed to fetch work periods" }, 500);
    }
  });

  // Get work period by id
  app.get("/work-periods/:id", validate("param", IdParamSchema), async (c) => {
    try {
      const { id } = c.req.valid("param") as { id: string };
      const workPeriod = await workPeriodRepository.findById(id);
      if (!workPeriod) {
        return c.json({ error: `Work period with ID '${id}' not found` }, 404);
      }
      const response = {
        id: workPeriod.id,
        name: workPeriod.name,
        date: workPeriod.date?.toISOString(),
        startTime: workPeriod.startTime.toISOString(),
        endTime: workPeriod.endTime.toISOString(),
        createdAt: workPeriod.createdAt.toISOString(),
        updatedAt: workPeriod.updatedAt.toISOString(),
        activities: [] as {
          id: string;
          type: string;
          note?: string | null;
          createdAt: string;
        }[],
      };
      const activities = await workPeriodRepository.getActivities(id);
      response.activities = activities.map((a) => ({
        id: a.id,
        type: a.type,
        note: a.note,
        createdAt: a.createdAt.toISOString(),
      }));
      return c.json(response);
    } catch (error) {
      return c.json({ error: "Failed to fetch work period" }, 500);
    }
  });

  // Create work period
  app.post("/work-periods", vValidator("json", createWorkPeriodSchema), async (c) => {
    try {
      const data = c.req.valid("json") as CreateWorkPeriodDTO;
      const useCase = new CreateWorkPeriodUseCase(workPeriodRepository);
      const workPeriod = await useCase.execute(data);
      const response = {
        id: workPeriod.id,
        name: workPeriod.name,
        date: workPeriod.date?.toISOString(),
        startTime: workPeriod.startTime.toISOString(),
        endTime: workPeriod.endTime.toISOString(),
        createdAt: workPeriod.createdAt.toISOString(),
        updatedAt: workPeriod.updatedAt.toISOString(),
        activities:
          workPeriod.activities?.map((a) => ({
            id: a.id,
            type: a.type,
            note: a.note,
            createdAt: a.createdAt.toISOString(),
          })) || [],
      };
      return c.json(response, 201);
    } catch (error) {
      return c.json({ error: "Failed to create work period" }, 500);
    }
  });

  // Update work period
  app.put(
    "/work-periods/:id",
    validate("param", IdParamSchema),
    validate("json", updateWorkPeriodSchema),
    async (c) => {
      try {
        const params = c.req.valid("param") as { id: string };
        const id = params.id;
        const data = c.req.valid("json") as Omit<UpdateWorkPeriodDTO, "id">;
        console.log("Validated data:", data);
        const updateData = { ...data };
        if (updateData.date && typeof updateData.date === "string") {
          updateData.date = new Date(updateData.date);
        }
        if (updateData.startTime && typeof updateData.startTime === "string") {
          updateData.startTime = new Date(updateData.startTime);
        }
        if (updateData.endTime && typeof updateData.endTime === "string") {
          updateData.endTime = new Date(updateData.endTime);
        }
        const useCase = new UpdateWorkPeriodUseCase(workPeriodRepository);
        const workPeriod = await useCase.execute({ id, ...updateData });
        const response = {
          id: workPeriod.id,
          name: workPeriod.name,
          date: workPeriod.date?.toISOString(),
          startTime: workPeriod.startTime.toISOString(),
          endTime: workPeriod.endTime.toISOString(),
          createdAt: workPeriod.createdAt.toISOString(),
          updatedAt: workPeriod.updatedAt.toISOString(),
          activities:
            workPeriod.activities?.map((a) => ({
              id: a.id,
              type: a.type,
              note: a.note,
              createdAt: a.createdAt.toISOString(),
            })) || [],
        };
        return c.json(response);
      } catch (error) {
        console.error("Error updating work period:", error);
        if (error instanceof WorkPeriodNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        return c.json({ error: "Failed to update work period" }, 500);
      }
    },
  );

  // Delete work period
  app.delete("/work-periods/:id", validate("param", IdParamSchema), async (c) => {
    try {
      const { id } = c.req.valid("param") as { id: string };
      const useCase = new DeleteWorkPeriodUseCase(workPeriodRepository);
      await useCase.execute({ id });
      c.status(204);
      return c.body(null);
    } catch (error) {
      if (error instanceof WorkPeriodNotFoundError) {
        return c.json({ error: error.message }, 404);
      }
      return c.json({ error: "Failed to delete work period" }, 500);
    }
  });

  // Associate a todo activity with a work period
  app.post(
    "/work-periods/:id/activities/:activityId",
    validate("param", object({ id: string(), activityId: string() })),
    async (c) => {
      try {
        const { id, activityId } = c.req.valid("param") as {
          id: string;
          activityId: string;
        };

        const workPeriod = await workPeriodRepository.findById(id);
        if (!workPeriod) {
          return c.json({ error: `Work period with ID '${id}' not found` }, 404);
        }

        const activity = await todoActivityRepository.findById(activityId);
        if (!activity) {
          return c.json({ error: `Todo activity with ID '${activityId}' not found` }, 404);
        }

        await workPeriodRepository.addActivity(id, activityId);
        c.status(201);
        return c.body(null);
      } catch (error) {
        return c.json({ error: "Failed to associate activity with work period" }, 500);
      }
    },
  );

  // Get activities in a work period
  app.get("/work-periods/:id/activities", validate("param", IdParamSchema), async (c) => {
    try {
      const { id } = c.req.valid("param") as { id: string };
      const workPeriod = await workPeriodRepository.findById(id);
      if (!workPeriod) {
        return c.json({ error: `Work period with ID '${id}' not found` }, 404);
      }

      const activities = await workPeriodRepository.getActivities(id);
      return c.json(activities);
    } catch (error) {
      return c.json({ error: "Failed to fetch work period activities" }, 500);
    }
  });

  // Remove an activity from a work period
  app.delete(
    "/work-periods/:id/activities/:activityId",
    validate("param", object({ id: string(), activityId: string() })),
    async (c) => {
      try {
        const { id, activityId } = c.req.valid("param") as {
          id: string;
          activityId: string;
        };

        const workPeriod = await workPeriodRepository.findById(id);
        if (!workPeriod) {
          return c.json({ error: `Work period with ID '${id}' not found` }, 404);
        }

        await workPeriodRepository.removeActivity(id, activityId);
        c.status(204);
        return c.body(null);
      } catch (error) {
        if (error instanceof TodoActivityNotFoundError) {
          return c.json({ error: error.message }, 404);
        }
        return c.json({ error: "Failed to remove activity from work period" }, 500);
      }
    },
  );

  return app;
}
