import type { WorkState } from "./todo";
import type { WorkPeriodId } from "./work-period";

export type TodoActivityId = string;

export enum ActivityType {
  STARTED = "started",
  PAUSED = "paused",
  COMPLETED = "completed",
  DISCARDED = "discarded",
}

export interface TodoActivity {
  id: TodoActivityId;
  todoId: string;
  type: ActivityType;
  workTime?: number;
  previousState?: WorkState;
  note?: string;
  createdAt: Date;
  workPeriodId?: WorkPeriodId;
}
