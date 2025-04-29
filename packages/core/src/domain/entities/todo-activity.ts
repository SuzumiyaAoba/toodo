import type { WorkState } from "./todo.js";
import type { WorkPeriodId } from "./work-period.js";

export enum ActivityType {
  STARTED = "started",
  PAUSED = "paused",
  COMPLETED = "completed",
  DISCARDED = "discarded",
}

export interface TodoActivity {
  id: string;
  todoId: string;
  type: ActivityType;
  workTime?: number;
  previousState?: WorkState;
  note?: string;
  createdAt: Date;
  workPeriodId?: WorkPeriodId;
}
