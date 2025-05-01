import type { PrismaClient } from "@prisma/client";
import { WorkPeriod } from "@toodo/core";
import type { WorkPeriodCreateInput } from "@toodo/core";
import type { TodoActivity } from "@toodo/core";
import { mapToDomainTodoActivity } from "../../domain/entities/todo-activity";
import { WorkPeriodNotFoundError } from "../../domain/errors/work-period-errors";
import type { WorkPeriodRepository as WorkPeriodRepositoryInterface } from "../../domain/repositories/work-period-repository";
import type {
  WorkPeriodStatistics,
  WorkPeriodStatisticsOptions,
} from "../../domain/repositories/work-period-repository";
import { handlePrismaError } from "../utils/error-handler";

function mapToDomainWorkPeriod(prismaWorkPeriod: any): WorkPeriod {
  return new WorkPeriod(
    prismaWorkPeriod.id,
    prismaWorkPeriod.name,
    new Date(prismaWorkPeriod.startTime),
    new Date(prismaWorkPeriod.endTime),
    prismaWorkPeriod.date ? new Date(prismaWorkPeriod.date) : undefined,
    new Date(prismaWorkPeriod.createdAt),
    new Date(prismaWorkPeriod.updatedAt),
    prismaWorkPeriod.activities?.map((activity: any) => ({
      id: activity.id,
      type: activity.type,
      note: activity.note,
      todoId: activity.todoId,
      workPeriodId: activity.workPeriodId,
      createdAt: new Date(activity.createdAt),
      updatedAt: new Date(activity.updatedAt),
    })) || [],
  );
}

export class WorkPeriodRepository implements WorkPeriodRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  private async executePrismaOperation<T>(operation: () => Promise<T>, id?: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw handlePrismaError(error, "WorkPeriod", id);
    }
  }

  async findAll(): Promise<WorkPeriod[]> {
    return this.executePrismaOperation(async () => {
      const workPeriods = await this.prisma.workPeriod.findMany({
        include: {
          activities: true,
        },
      });
      return workPeriods.map(mapToDomainWorkPeriod);
    });
  }

  async findById(id: string): Promise<WorkPeriod | null> {
    return this.executePrismaOperation(async () => {
      const workPeriod = await this.prisma.workPeriod.findUnique({
        where: { id },
        include: {
          activities: true,
        },
      });
      return workPeriod ? mapToDomainWorkPeriod(workPeriod) : null;
    }, id);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WorkPeriod[]> {
    return this.executePrismaOperation(async () => {
      const workPeriods = await this.prisma.workPeriod.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "desc" },
      });
      return workPeriods.map(mapToDomainWorkPeriod);
    });
  }

  async create(workPeriod: WorkPeriodCreateInput): Promise<WorkPeriod> {
    return this.executePrismaOperation(async () => {
      const created = await this.prisma.workPeriod.create({
        data: {
          name: workPeriod.name,
          date: workPeriod.date,
          startTime: workPeriod.startTime,
          endTime: workPeriod.endTime,
        },
        include: {
          activities: true,
        },
      });
      return mapToDomainWorkPeriod(created);
    });
  }

  async update(id: string, workPeriod: Partial<WorkPeriodCreateInput>): Promise<WorkPeriod> {
    return this.executePrismaOperation(async () => {
      const existing = await this.prisma.workPeriod.findUnique({
        where: { id },
        include: {
          activities: true,
        },
      });

      if (!existing) {
        throw new WorkPeriodNotFoundError(id);
      }

      console.log("Input workPeriod:", workPeriod);
      console.log("Existing workPeriod:", existing);

      let updatedWorkPeriod = mapToDomainWorkPeriod(existing);

      if (workPeriod.name !== undefined) {
        updatedWorkPeriod = updatedWorkPeriod.updateName(workPeriod.name);
      }

      if (workPeriod.date !== undefined) {
        updatedWorkPeriod = updatedWorkPeriod.updateDate(workPeriod.date);
      }

      if (workPeriod.startTime !== undefined && workPeriod.endTime !== undefined) {
        updatedWorkPeriod = updatedWorkPeriod.updatePeriod(workPeriod.startTime, workPeriod.endTime);
      } else if (workPeriod.startTime !== undefined) {
        updatedWorkPeriod = updatedWorkPeriod.updatePeriod(workPeriod.startTime, updatedWorkPeriod.endTime);
      } else if (workPeriod.endTime !== undefined) {
        updatedWorkPeriod = updatedWorkPeriod.updatePeriod(updatedWorkPeriod.startTime, workPeriod.endTime);
      }

      console.log("Updated workPeriod:", {
        name: updatedWorkPeriod.name,
        date: updatedWorkPeriod.date,
        startTime: updatedWorkPeriod.startTime,
        endTime: updatedWorkPeriod.endTime,
        updatedAt: updatedWorkPeriod.updatedAt,
      });

      const updated = await this.prisma.workPeriod.update({
        where: { id },
        data: {
          name: updatedWorkPeriod.name,
          date: updatedWorkPeriod.date,
          startTime: updatedWorkPeriod.startTime,
          endTime: updatedWorkPeriod.endTime,
          updatedAt: updatedWorkPeriod.updatedAt,
        },
        include: {
          activities: true,
        },
      });

      console.log("Prisma update result:", updated);

      return mapToDomainWorkPeriod(updated);
    });
  }

  async delete(id: string): Promise<void> {
    return this.executePrismaOperation(async () => {
      await this.prisma.workPeriod.delete({
        where: { id },
      });
    }, id);
  }

  async addActivity(workPeriodId: string, activityId: string): Promise<void> {
    return this.executePrismaOperation(async () => {
      await this.prisma.todoActivity.update({
        where: { id: activityId },
        data: { workPeriodId },
      });
    }, `${workPeriodId}-${activityId}`);
  }

  async removeActivity(workPeriodId: string, activityId: string): Promise<void> {
    return this.executePrismaOperation(async () => {
      await this.prisma.todoActivity.update({
        where: { id: activityId },
        data: { workPeriodId: null },
      });
    }, `${workPeriodId}-${activityId}`);
  }

  async getActivities(workPeriodId: string): Promise<TodoActivity[]> {
    return this.executePrismaOperation(async () => {
      const activities = await this.prisma.todoActivity.findMany({
        where: { workPeriodId },
      });
      return activities.map(mapToDomainTodoActivity);
    }, workPeriodId);
  }

  async findOverlapping(startTime: Date, endTime: Date, date: Date, excludeId?: string): Promise<WorkPeriod[]> {
    return this.executePrismaOperation(async () => {
      const workPeriods = await this.prisma.workPeriod.findMany({
        where: {
          date,
          AND: [
            {
              OR: [
                {
                  startTime: { lte: startTime },
                  endTime: { gt: startTime },
                },
                {
                  startTime: { lt: endTime },
                  endTime: { gte: endTime },
                },
                {
                  startTime: { gte: startTime },
                  endTime: { lte: endTime },
                },
              ],
            },
            excludeId ? { id: { not: excludeId } } : {},
          ],
        },
      });
      return workPeriods.map(mapToDomainWorkPeriod);
    });
  }

  async getStatistics(options?: WorkPeriodStatisticsOptions): Promise<WorkPeriodStatistics> {
    // 統計情報の取得ロジックを実装
    throw new Error("Not implemented");
  }
}
