import type { TodoActivity as PrismaTodoActivity } from "../../generated/prisma";
import type { WorkState } from "./todo";

/**
 * ActivityType enum
 */
export enum ActivityType {
  STARTED = "started",
  PAUSED = "paused",
  COMPLETED = "completed",
  DISCARDED = "discarded",
}

/**
 * TodoActivity entity
 */
export interface TodoActivity {
  id: string;
  todoId: string;
  type: ActivityType;
  workTime?: number;
  previousState?: WorkState;
  note?: string;
  createdAt: Date;
}

/**
 * Convert PrismaTodoActivity to TodoActivity domain entity
 */
export function mapToDomainTodoActivity(prismaTodoActivity: PrismaTodoActivity): TodoActivity {
  return {
    id: prismaTodoActivity.id,
    todoId: prismaTodoActivity.todoId,
    type: prismaTodoActivity.type as ActivityType,
    workTime: prismaTodoActivity.workTime || undefined,
    previousState: prismaTodoActivity.previousState as WorkState | undefined,
    note: prismaTodoActivity.note || undefined,
    createdAt: prismaTodoActivity.createdAt,
  };
}
