import type { PrismaClient } from "@prisma/client";
import type { ActivityType, TodoActivity, WorkPeriod, WorkPeriodCreateInput } from "@toodo/core";
import { mapToDomainWorkPeriod } from "@toodo/core";
import { mapToDomainTodoActivity } from "../../domain/entities/todo-activity";
import type {
  WorkPeriodRepository as WorkPeriodRepositoryInterface,
  WorkPeriodStatistics,
  WorkPeriodStatisticsOptions,
} from "../../domain/repositories/work-period-repository";
import type { WorkPeriod as PrismaWorkPeriod } from "../../generated/prisma";
import { handlePrismaError } from "../utils/error-handler";

export class WorkPeriodRepository implements WorkPeriodRepositoryInterface {
  constructor(private readonly prisma: PrismaClient) {}

  protected async executePrismaOperation<T>(operation: () => Promise<T>, entityId?: string): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      handlePrismaError(error, "WorkPeriod", entityId);
    }
  }

  async findAll(): Promise<WorkPeriod[]> {
    return this.executePrismaOperation(async () => {
      const workPeriods = await this.prisma.workPeriod.findMany({
        orderBy: { date: "desc" },
      });
      return workPeriods.map(mapToDomainWorkPeriod);
    });
  }

  async findById(id: string): Promise<WorkPeriod | null> {
    return this.executePrismaOperation(async () => {
      const workPeriod = await this.prisma.workPeriod.findUnique({
        where: { id },
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
          date: workPeriod.date ?? new Date(),
          startTime: workPeriod.startTime,
          endTime: workPeriod.endTime,
        },
      });
      return mapToDomainWorkPeriod(created);
    });
  }

  async update(id: string, workPeriod: Partial<WorkPeriodCreateInput>): Promise<WorkPeriod> {
    return this.executePrismaOperation(async () => {
      const updated = await this.prisma.workPeriod.update({
        where: { id },
        data: {
          ...(workPeriod.name !== undefined && { name: workPeriod.name }),
          ...(workPeriod.date !== undefined && { date: workPeriod.date }),
          ...(workPeriod.startTime !== undefined && {
            startTime: workPeriod.startTime,
          }),
          ...(workPeriod.endTime !== undefined && {
            endTime: workPeriod.endTime,
          }),
        },
      });
      return mapToDomainWorkPeriod(updated);
    }, id);
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
