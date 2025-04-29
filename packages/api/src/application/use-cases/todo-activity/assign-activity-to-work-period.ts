import type { TodoActivity } from "@toodo/core";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { WorkPeriodRepository } from "../../../domain/repositories/work-period-repository";

export interface AssignActivityToWorkPeriodDTO {
  activityId: string;
  workPeriodId: string;
}

export class AssignActivityToWorkPeriodUseCase {
  constructor(
    private readonly todoActivityRepository: TodoActivityRepository,
    private readonly workPeriodRepository: WorkPeriodRepository,
  ) {}

  async execute(input: AssignActivityToWorkPeriodDTO): Promise<TodoActivity> {
    const activity = (await this.todoActivityRepository.findById(input.activityId)) as TodoActivity;
    if (!activity) {
      throw new Error(`Activity with id ${input.activityId} not found`);
    }

    const workPeriod = await this.workPeriodRepository.findById(input.workPeriodId);
    if (!workPeriod) {
      throw new Error(`Work period with id ${input.workPeriodId} not found`);
    }

    // アクティビティの作成時間が稼働時間の範囲内かチェック
    const activityTime = activity.createdAt.getTime();
    const workPeriodStart = workPeriod.startTime.getTime();
    const workPeriodEnd = workPeriod.endTime.getTime();

    if (activityTime < workPeriodStart || activityTime > workPeriodEnd) {
      throw new Error(
        "Activity time is outside of work period range. Please choose a work period that covers the activity time.",
      );
    }

    const updatedActivity = (await this.todoActivityRepository.updateWorkPeriod(
      input.activityId,
      input.workPeriodId,
    )) as TodoActivity;
    if (!updatedActivity) {
      throw new Error(`Failed to update work period for activity ${input.activityId}`);
    }

    return updatedActivity;
  }
}
