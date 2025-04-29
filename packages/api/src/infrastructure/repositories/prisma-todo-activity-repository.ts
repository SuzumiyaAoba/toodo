import type { TodoActivity } from "@toodo/core";
import { mapToDomainTodoActivity } from "../../domain/entities/todo-activity";
import { TodoActivityNotFoundError } from "../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../domain/repositories/todo-activity-repository";
import type { PrismaClient, TodoActivity as PrismaTodoActivity } from "../../generated/prisma";
import { PrismaBaseRepository } from "./prisma-base-repository";

/**
 * PrismaTodoActivityRepository implements TodoActivityRepository using Prisma ORM
 */
export class PrismaTodoActivityRepository
  extends PrismaBaseRepository<TodoActivity, PrismaTodoActivity>
  implements TodoActivityRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma, "TodoActivity");
  }

  /**
   * Map a Prisma TodoActivity model to a domain TodoActivity entity
   */
  protected mapToDomain(prismaTodoActivity: PrismaTodoActivity): TodoActivity {
    return mapToDomainTodoActivity(prismaTodoActivity);
  }

  async findByTodoId(todoId: string): Promise<TodoActivity[]> {
    return this.executePrismaOperation(async () => {
      const activities = await this.prisma.todoActivity.findMany({
        where: { todoId },
        orderBy: { createdAt: "desc" },
      });
      return this.mapToDomainArray(activities);
    });
  }

  async findById(id: string): Promise<TodoActivity | null> {
    return this.executePrismaOperation(async () => {
      const activity = await this.prisma.todoActivity.findUnique({
        where: { id },
      });
      return activity ? this.mapToDomain(activity) : null;
    }, id);
  }

  async create(activity: Omit<TodoActivity, "id" | "createdAt">): Promise<TodoActivity> {
    return this.executePrismaOperation(async () => {
      const createdActivity = await this.prisma.todoActivity.create({
        data: {
          todoId: activity.todoId,
          type: activity.type,
          workTime: activity.workTime,
          previousState: activity.previousState,
          note: activity.note,
          workPeriodId: activity.workPeriodId,
        },
      });
      return this.mapToDomain(createdActivity);
    });
  }

  async update(id: string, activity: Partial<TodoActivity>): Promise<TodoActivity | null> {
    return this.executePrismaOperation(async () => {
      const existingActivity = await this.prisma.todoActivity.findUnique({
        where: { id },
      });
      if (!existingActivity) {
        return null;
      }

      const updatedActivity = await this.prisma.todoActivity.update({
        where: { id },
        data: {
          type: activity.type,
          workTime: activity.workTime,
          previousState: activity.previousState,
          note: activity.note,
          workPeriodId: activity.workPeriodId,
        },
      });
      return this.mapToDomain(updatedActivity);
    }, id);
  }

  async updateWorkPeriod(id: string, workPeriodId: string | null): Promise<TodoActivity> {
    return this.executePrismaOperation(async () => {
      // Check if activity exists
      const existingActivity = await this.prisma.todoActivity.findUnique({
        where: { id },
      });
      if (!existingActivity) {
        throw new TodoActivityNotFoundError(id);
      }

      const updatedActivity = await this.prisma.todoActivity.update({
        where: { id },
        data: { workPeriodId },
      });
      return this.mapToDomain(updatedActivity);
    }, id);
  }

  async findByWorkPeriodId(workPeriodId: string): Promise<TodoActivity[]> {
    return this.executePrismaOperation(async () => {
      const activities = await this.prisma.todoActivity.findMany({
        where: { workPeriodId },
        orderBy: { createdAt: "desc" },
      });
      return this.mapToDomainArray(activities);
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<TodoActivity[]> {
    return this.executePrismaOperation(async () => {
      const activities = await this.prisma.todoActivity.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return this.mapToDomainArray(activities);
    });
  }

  async delete(id: string): Promise<void> {
    return this.executePrismaOperation(async () => {
      // Check if activity exists
      const existingActivity = await this.prisma.todoActivity.findUnique({
        where: { id },
      });
      if (!existingActivity) {
        throw new TodoActivityNotFoundError(id);
      }

      await this.prisma.todoActivity.delete({ where: { id } });
    }, id);
  }

  async getTotalWorkTime(todoId: string): Promise<number> {
    return this.executePrismaOperation(async () => {
      const result = await this.prisma.todoActivity.aggregate({
        where: { todoId },
        _sum: { workTime: true },
      });
      return result._sum.workTime ?? 0;
    });
  }

  async findByWorkPeriod(workPeriodId: string): Promise<TodoActivity[]> {
    return this.findByWorkPeriodId(workPeriodId);
  }
}
