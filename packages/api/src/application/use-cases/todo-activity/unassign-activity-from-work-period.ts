import type { TodoActivity } from "@toodo/core";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";

export interface UnassignActivityFromWorkPeriodDTO {
  activityId: string;
}

export class UnassignActivityFromWorkPeriodUseCase {
  constructor(private readonly todoActivityRepository: TodoActivityRepository) {}

  async execute(input: UnassignActivityFromWorkPeriodDTO): Promise<TodoActivity> {
    const activity = (await this.todoActivityRepository.findById(input.activityId)) as TodoActivity;
    if (!activity) {
      throw new Error(`Activity with id ${input.activityId} not found`);
    }

    if (activity.workPeriodId === null) {
      return activity; // すでに稼働時間が設定されていない場合はそのまま返す
    }

    const updatedActivity = (await this.todoActivityRepository.updateWorkPeriod(
      input.activityId,
      null,
    )) as TodoActivity;
    if (!updatedActivity) {
      throw new Error(`Failed to unassign work period for activity ${input.activityId}`);
    }

    return updatedActivity;
  }
}
