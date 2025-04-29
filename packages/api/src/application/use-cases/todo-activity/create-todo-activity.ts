import { ActivityType, type TodoActivity } from "@toodo/core";
import { type Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { InvalidStateTransitionError, TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * CreateTodoActivityUseCase handles recording a new activity for a todo
 */
export class CreateTodoActivityUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private todoActivityRepository: TodoActivityRepository,
  ) {}

  /**
   * Execute the use case
   * @param todoId Todo id
   * @param data Activity data
   * @returns Created activity
   */
  async execute(
    todoId: string,
    data: {
      type: string;
      note?: string;
    },
  ): Promise<TodoActivity> {
    // Find the todo
    const todo = await this.todoRepository.findById(todoId);
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    // ActivityTypeのstring値をenumに変換
    let activityType: ActivityType;
    switch (data.type) {
      case ActivityType.STARTED:
      case "started":
        activityType = ActivityType.STARTED;
        break;
      case ActivityType.PAUSED:
      case "paused":
        activityType = ActivityType.PAUSED;
        break;
      case ActivityType.COMPLETED:
      case "completed":
        activityType = ActivityType.COMPLETED;
        break;
      case ActivityType.DISCARDED:
      case "discarded":
        activityType = ActivityType.DISCARDED;
        break;
      default:
        throw new InvalidStateTransitionError(`Unknown activity type: ${data.type}`);
    }

    // Calculate work time and determine the new state
    const { workTime, newWorkState } = this.calculateWorkTimeAndState(todo, activityType);

    // Create the activity record
    const activity = await this.todoActivityRepository.create({
      todoId,
      type: activityType,
      workTime: workTime ?? undefined,
      previousState: todo.workState,
      note: data.note,
    });

    // Update the todo's state and work time
    let totalWorkTime = todo.totalWorkTime;
    if (workTime && [ActivityType.PAUSED, ActivityType.COMPLETED].includes(activityType)) {
      totalWorkTime += workTime;
    }

    await this.todoRepository.update(todoId, {
      status: activityType === ActivityType.COMPLETED ? TodoStatus.COMPLETED : todo.status,
      workState: newWorkState,
      totalWorkTime,
      lastStateChangeAt: new Date(),
    });

    return activity;
  }

  /**
   * Calculate work time and determine the new state based on activity type
   * @param todo Current todo
   * @param activityType Type of activity being recorded
   * @returns Work time and new work state
   */
  private calculateWorkTimeAndState(
    todo: Todo,
    activityType: ActivityType,
  ): { workTime: number | null; newWorkState: WorkState } {
    let workTime = null;
    let newWorkState = todo.workState;

    switch (activityType) {
      case ActivityType.STARTED:
        // Cannot start if already active or completed
        if (todo.workState === WorkState.ACTIVE) {
          throw new InvalidStateTransitionError("Invalid state transition. TODO is already active");
        }
        if (todo.workState === WorkState.COMPLETED) {
          throw new InvalidStateTransitionError("Invalid state transition. Cannot start a completed TODO");
        }
        newWorkState = WorkState.ACTIVE;
        workTime = 0; // Starting the work, so no time yet
        break;

      case ActivityType.PAUSED: {
        // Can only pause if active
        if (todo.workState !== WorkState.ACTIVE) {
          throw new InvalidStateTransitionError("Invalid state transition. Can only pause an active TODO");
        }
        newWorkState = WorkState.PAUSED;

        // Calculate the elapsed time since the last state change
        const pauseTime = new Date();
        const elapsedSeconds = Math.floor((pauseTime.getTime() - todo.lastStateChangeAt.getTime()) / 1000);
        workTime = elapsedSeconds;
        break;
      }
      case ActivityType.COMPLETED:
        // Can mark as completed from any state except already completed
        if (todo.workState === WorkState.COMPLETED) {
          throw new InvalidStateTransitionError("Invalid state transition. TODO is already completed");
        }
        newWorkState = WorkState.COMPLETED;

        // If active, calculate the elapsed time
        if (todo.workState === WorkState.ACTIVE) {
          const completeTime = new Date();
          const elapsedSeconds = Math.floor((completeTime.getTime() - todo.lastStateChangeAt.getTime()) / 1000);
          workTime = elapsedSeconds;
        } else {
          workTime = 0; // No additional time if not active
        }
        break;

      case ActivityType.DISCARDED:
        // Record the work time if active at time of discard
        if (todo.workState === WorkState.ACTIVE) {
          const discardTime = new Date();
          const elapsedSeconds = Math.floor((discardTime.getTime() - todo.lastStateChangeAt.getTime()) / 1000);
          workTime = elapsedSeconds;
        }
        break;
    }

    return { workTime, newWorkState };
  }
}
