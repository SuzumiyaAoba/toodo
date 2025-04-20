import type { TodoActivity } from "../../domain/entities/todo-activity";
import { mapToDomainTodoActivity } from "../../domain/entities/todo-activity";
import { TodoActivityNotFoundError } from "../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../domain/repositories/todo-activity-repository";
import type { PrismaClient } from "../../generated/prisma";

/**
 * PrismaTodoActivityRepository implements TodoActivityRepository using Prisma ORM
 */
export class PrismaTodoActivityRepository implements TodoActivityRepository {
  constructor(private prisma: PrismaClient) {}

  async findByTodoId(todoId: string): Promise<TodoActivity[]> {
    const activities = await this.prisma.todoActivity.findMany({
      where: { todoId },
      orderBy: { createdAt: "desc" },
    });
    return activities.map(mapToDomainTodoActivity);
  }

  async findById(id: string): Promise<TodoActivity | null> {
    const activity = await this.prisma.todoActivity.findUnique({ where: { id } });
    return activity ? mapToDomainTodoActivity(activity) : null;
  }

  async create(activity: Omit<TodoActivity, "id" | "createdAt">): Promise<TodoActivity> {
    const createdActivity = await this.prisma.todoActivity.create({
      data: {
        todoId: activity.todoId,
        type: activity.type,
        workTime: activity.workTime,
        previousState: activity.previousState,
        note: activity.note,
      },
    });
    return mapToDomainTodoActivity(createdActivity);
  }

  async delete(id: string): Promise<void> {
    // Check if activity exists
    const existingActivity = await this.prisma.todoActivity.findUnique({ where: { id } });
    if (!existingActivity) {
      throw new TodoActivityNotFoundError(id);
    }

    await this.prisma.todoActivity.delete({ where: { id } });
  }
}
