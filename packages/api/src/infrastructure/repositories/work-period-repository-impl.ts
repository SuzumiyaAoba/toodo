import type { PrismaClient } from "@prisma/client";
import { type WorkPeriod, type WorkPeriodCreateInput, mapToDomainWorkPeriod } from "@toodo/core";
import type {
  WorkPeriodRepository,
  WorkPeriodStatistics,
  WorkPeriodStatisticsOptions,
} from "../../domain/repositories/work-period-repository";

export class WorkPeriodRepositoryImpl implements WorkPeriodRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<WorkPeriod[]> {
    const workPeriods = await this.prisma.workPeriod.findMany({
      orderBy: { date: "desc" },
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
      orderBy: { date: "desc" },
    });
    return workPeriods.map(mapToDomainWorkPeriod);
  }

  async create(workPeriod: Omit<WorkPeriod, "id" | "createdAt" | "updatedAt">): Promise<WorkPeriod> {
    const created = await this.prisma.workPeriod.create({
      data: {
        name: workPeriod.name,
        date: workPeriod.date,
        startTime: workPeriod.startTime,
        endTime: workPeriod.endTime,
      },
    });
    return mapToDomainWorkPeriod(created);
  }

  async update(
    id: string,
    workPeriod: Partial<Omit<WorkPeriod, "id" | "createdAt" | "updatedAt">>,
  ): Promise<WorkPeriod> {
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
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workPeriod.delete({
      where: { id },
    });
  }

  async getStatistics(options?: WorkPeriodStatisticsOptions): Promise<WorkPeriodStatistics> {
    const { startDate, endDate } = options || {};

    // 期間内の稼働時間を取得
    const workPeriods = await this.prisma.workPeriod.findMany({
      where: {
        ...(startDate && endDate ? { date: { gte: startDate, lte: endDate } } : {}),
      },
      include: {
        activities: {
          include: {
            todo: {
              include: {
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 総稼働時間
    let totalWorkPeriodTime = 0;
    // 総活動時間
    let totalActivityTime = 0;
    // Todo別活動時間
    const todoActivities: Record<string, { title: string; time: number }> = {};
    // タグ別活動時間
    const tagActivities: Record<string, { name: string; time: number }> = {};

    // 統計計算
    for (const workPeriod of workPeriods) {
      const workPeriodDuration = workPeriod.endTime.getTime() - workPeriod.startTime.getTime();
      totalWorkPeriodTime += workPeriodDuration;

      for (const activity of workPeriod.activities || []) {
        if (!activity.workTime) continue;

        totalActivityTime += activity.workTime * 1000; // 秒からミリ秒に変換

        // Todo別集計
        const todo = activity.todo;
        if (todo) {
          if (!todoActivities[activity.todoId]) {
            todoActivities[activity.todoId] = {
              title: todo.title || "Unknown",
              time: 0,
            };
          }

          // 安全に参照するため存在確認を追加
          const todoActivity = todoActivities[activity.todoId];
          if (todoActivity) {
            todoActivity.time += activity.workTime * 1000;
          }

          // タグ別集計
          if (todo.tags && Array.isArray(todo.tags)) {
            for (const todoTag of todo.tags) {
              if (todoTag.tag) {
                const tagId = todoTag.tag.id;
                if (!tagActivities[tagId]) {
                  tagActivities[tagId] = {
                    name: todoTag.tag.name || "Unknown",
                    time: 0,
                  };
                }
                tagActivities[tagId].time += activity.workTime * 1000;
              }
            }
          }
        }
      }
    }

    // 稼働率計算
    const utilizationRate = totalWorkPeriodTime > 0 ? totalActivityTime / totalWorkPeriodTime : 0;

    // 戻り値の形式に変換
    const activitiesByTodo: Record<string, number> = {};
    for (const [todoId, data] of Object.entries(todoActivities)) {
      activitiesByTodo[todoId] = data.time;
    }

    const activitiesByTag: Record<string, number> = {};
    for (const [tagId, data] of Object.entries(tagActivities)) {
      activitiesByTag[tagId] = data.time;
    }

    return {
      totalWorkPeriodTime,
      totalActivityTime,
      utilizationRate,
      activitiesByTodo,
      activitiesByTag,
    };
  }

  async findOverlapping(startTime: Date, endTime: Date, date: Date, excludeId?: string): Promise<WorkPeriod[]> {
    const workPeriods = await this.prisma.workPeriod.findMany({
      where: {
        date: date,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          // 開始時間が範囲内
          {
            startTime: {
              gte: startTime,
              lt: endTime,
            },
          },
          // 終了時間が範囲内
          {
            endTime: {
              gt: startTime,
              lte: endTime,
            },
          },
          // 範囲を内包
          {
            startTime: { lte: startTime },
            endTime: { gte: endTime },
          },
        ],
      },
    });
    return workPeriods.map(mapToDomainWorkPeriod);
  }
}
