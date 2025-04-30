import { ActivityType } from "@toodo/core";
import type { TodoActivity, WorkState } from "@toodo/core";
import type { TodoActivity as PrismaTodoActivity } from "../../generated/prisma";

export { ActivityType };
export type { TodoActivity, WorkState };

export const mapToDomainTodoActivity = (prismaTodoActivity: PrismaTodoActivity): TodoActivity => ({
  id: prismaTodoActivity.id,
  todoId: prismaTodoActivity.todoId,
  type: prismaTodoActivity.type as ActivityType,
  workTime: prismaTodoActivity.workTime ?? undefined,
  previousState: prismaTodoActivity.previousState ? (prismaTodoActivity.previousState as WorkState) : undefined,
  note: prismaTodoActivity.note ?? undefined,
  createdAt: prismaTodoActivity.createdAt,
  workPeriodId: prismaTodoActivity.workPeriodId ?? undefined,
});
