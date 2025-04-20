import {
  TodoActivityNotFoundError,
  TodoNotFoundError,
  UnauthorizedActivityDeletionError,
} from "../../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * DeleteTodoActivityUseCase handles deleting a todo activity
 */
export class DeleteTodoActivityUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private todoActivityRepository: TodoActivityRepository,
  ) {}

  /**
   * Execute the use case
   * @param todoId Todo id
   * @param activityId Activity id
   */
  async execute(todoId: string, activityId: string): Promise<void> {
    // Check if the todo exists
    const todo = await this.todoRepository.findById(todoId);
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    // Check if the activity exists
    const activity = await this.todoActivityRepository.findById(activityId);
    if (!activity) {
      throw new TodoActivityNotFoundError(activityId);
    }

    // Verify that the activity belongs to the todo
    if (activity.todoId !== todoId) {
      throw new UnauthorizedActivityDeletionError(activityId, "Activity does not belong to this TODO");
    }

    // Check if deleting this activity would affect work time calculations
    if (activity.workTime && activity.workTime > 0) {
      throw new UnauthorizedActivityDeletionError(
        activityId,
        "Cannot delete this activity as it would affect the work time calculations",
      );
    }

    // If it's a state-changing activity, check if it's the most recent of its type
    if (["started", "paused", "completed"].includes(activity.type)) {
      const activities = await this.todoActivityRepository.findByTodoId(todoId);

      // Find the most recent activity of the same type
      const sameTypeActivities = activities.filter((a) => a.type === activity.type);
      if (sameTypeActivities.length > 0) {
        const latestActivity = sameTypeActivities[0]; // Activities are ordered by date desc

        if (latestActivity.id === activityId) {
          throw new UnauthorizedActivityDeletionError(
            activityId,
            "Cannot delete the most recent state-changing activity",
          );
        }
      }
    }

    // If all validations pass, delete the activity
    await this.todoActivityRepository.delete(activityId);
  }
}
