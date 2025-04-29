import type { WorkPeriod, WorkPeriodCreateInput } from "@toodo/core";
import { mapToDomainWorkPeriod } from "@toodo/core";
import type {
  WorkPeriodRepository as WorkPeriodRepositoryInterface,
  WorkPeriodStatistics,
  WorkPeriodStatisticsOptions,
} from "../../domain/repositories/work-period-repository";
import type { PrismaClient } from "../../generated/prisma";

export class WorkPeriodRepository implements WorkPeriodRepositoryInterface {
  constructor(private readonly prisma: PrismaClient = {} as PrismaClient) {}

  async findAll(): Promise<WorkPeriod[]> {
    const workPeriods = await this.prisma.workPeriod.findMany({
      orderBy: { startTime: "desc" },
    });
    return workPeriods.map(mapToDomainWorkPeriod);
  }

  async findById(id: string): Promise<WorkPeriod | null> {
    const workPeriod = await this.prisma.workPeriod.findUnique({
      where: { id },
    });
    return workPeriod ? mapToDomainWorkPeriod(workPeriod) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WorkPeriod[]> {
    const workPeriods = await this.prisma.workPeriod.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startTime: "desc" },
    });
    return workPeriods.map(mapToDomainWorkPeriod);
  }

  async create(workPeriod: Omit<WorkPeriod, "id" | "createdAt" | "updatedAt">): Promise<WorkPeriod> {
    const createdWorkPeriod = await this.prisma.workPeriod.create({
      data: {
        name: workPeriod.name,
        date: workPeriod.date,
        startTime: workPeriod.startTime,
        endTime: workPeriod.endTime,
      },
    });
    return mapToDomainWorkPeriod(createdWorkPeriod);
  }

  async update(
    id: string,
    workPeriod: Partial<Omit<WorkPeriod, "id" | "createdAt" | "updatedAt">>,
  ): Promise<WorkPeriod> {
    const updatedWorkPeriod = await this.prisma.workPeriod.update({
      where: { id },
      data: {
        name: workPeriod.name,
        date: workPeriod.date,
        startTime: workPeriod.startTime,
        endTime: workPeriod.endTime,
      },
    });
    return mapToDomainWorkPeriod(updatedWorkPeriod);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workPeriod.delete({
      where: { id },
    });
  }

  async getStatistics(options?: WorkPeriodStatisticsOptions): Promise<WorkPeriodStatistics> {
    // 稼働時間のフィルタリング条件を構築
    const workPeriodWhere: Record<string, unknown> = {};
    if (options?.startDate || options?.endDate) {
      workPeriodWhere.date = {};
      if (options?.startDate) {
        (workPeriodWhere.date as Record<string, Date>).gte = options.startDate;
      }
      if (options?.endDate) {
        (workPeriodWhere.date as Record<string, Date>).lte = options.endDate;
      }
    }
    if (options?.workPeriodIds && options.workPeriodIds.length > 0) {
      workPeriodWhere.id = { in: options.workPeriodIds };
    }

    // アクティビティのフィルタリング条件を構築
    const activityWhere: Record<string, unknown> = {
      workPeriodId: { not: null },
      workTime: { not: null },
    };

    if (options?.todoIds && options.todoIds.length > 0) {
      activityWhere.todoId = { in: options.todoIds };
    }

    // タグによるフィルタリング条件
    let tagFilter = undefined;
    if (options?.tagIds && options.tagIds.length > 0) {
      tagFilter = {
        some: {
          tagId: { in: options.tagIds },
        },
      };
    }

    // 稼働時間を取得
    const workPeriods = await this.prisma.workPeriod.findMany({
      where: workPeriodWhere as Record<string, unknown>,
    });

    // 合計稼働時間を計算
    const totalWorkPeriodTime = workPeriods.reduce(
      (sum: number, wp) => sum + new Date(wp.endTime).getTime() - new Date(wp.startTime).getTime(),
      0,
    );

    // アクティビティを取得
    const activities = await this.prisma.todoActivity.findMany({
      where: {
        ...(activityWhere as Record<string, unknown>),
        workPeriodId: { in: workPeriods.map((wp) => wp.id) },
      },
      include: {
        todo: {
          include: {
            tags: true,
          },
        },
      },
    });

    // タグでフィルタリング
    const filteredActivities = options?.tagIds
      ? activities.filter((activity) => {
          return activity.todo?.tags?.some((todoTag) => options.tagIds?.includes(todoTag.tagId)) ?? false;
        })
      : activities;

    // アクティビティの合計時間を計算
    const totalActivityTime = filteredActivities.reduce((sum: number, activity) => sum + (activity.workTime || 0), 0);

    // TODOごとの活動時間
    const activitiesByTodo: Record<string, number> = {};
    for (const activity of filteredActivities) {
      if (activity.workTime) {
        const todoId = activity.todoId;
        if (activitiesByTodo[todoId] === undefined) {
          activitiesByTodo[todoId] = 0;
        }
        const workTime = activity.workTime;
        activitiesByTodo[todoId] = activitiesByTodo[todoId] + workTime;
      }
    }

    // タグごとの活動時間
    const activitiesByTag: Record<string, number> = {};
    for (const activity of filteredActivities) {
      if (activity.workTime && activity.todo?.tags) {
        const workTime = activity.workTime;
        for (const todoTag of activity.todo.tags) {
          const tagId = todoTag.tagId;
          if (activitiesByTag[tagId] === undefined) {
            activitiesByTag[tagId] = 0;
          }
          activitiesByTag[tagId] = activitiesByTag[tagId] + workTime;
        }
      }
    }

    return {
      totalWorkPeriodTime,
      totalActivityTime,
      utilizationRate: totalWorkPeriodTime > 0 ? totalActivityTime / totalWorkPeriodTime : 0,
      activitiesByTodo,
      activitiesByTag,
    };
  }

  async findOverlapping(startTime: Date, endTime: Date, date: Date, excludeId?: string): Promise<WorkPeriod[]> {
    const workPeriods = await this.prisma.workPeriod.findMany({
      where: {
        date: date,
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
  }
}
