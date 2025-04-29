import type { TodoActivity } from "@toodo/core";
import { ActivityType } from "@toodo/core";
import type { TodoActivityRepository as TodoActivityRepositoryInterface } from "../../domain/repositories/todo-activity-repository";
import type { PrismaClient } from "../../generated/prisma";

export class TodoActivityRepository implements TodoActivityRepositoryInterface {
  constructor(private readonly prisma: PrismaClient = {} as PrismaClient) {}

  async create(todoActivity: TodoActivity): Promise<TodoActivity> {
    return todoActivity;
  }

  async findById(id: string): Promise<TodoActivity | null> {
    return null;
  }

  async findByTodoId(todoId: string): Promise<TodoActivity[]> {
    return [];
  }

  async delete(id: string): Promise<void> {
    // 削除処理
  }

  async update(id: string, todoActivity: Partial<TodoActivity>): Promise<TodoActivity | null> {
    return { ...todoActivity, id } as TodoActivity;
  }

  async getTotalWorkTime(todoId: string): Promise<number> {
    return 0;
  }

  async findByWorkPeriod(workPeriodId: string): Promise<TodoActivity[]> {
    return [];
  }

  async updateWorkPeriod(id: string, workPeriodId: string | null): Promise<TodoActivity | null> {
    return {
      id,
      workPeriodId,
      todoId: "dummy-todo-id",
      type: ActivityType.STARTED,
      createdAt: new Date(),
    } as TodoActivity;
  }

  async findByWorkPeriodId(workPeriodId: string): Promise<TodoActivity[]> {
    return [];
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<TodoActivity[]> {
    return [];
  }
}
