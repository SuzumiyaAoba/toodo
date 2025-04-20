import type { Todo as PrismaTodo } from "../../generated/prisma";

/**
 * Todo status enum
 */
export enum TodoStatus {
  PENDING = "pending",
  COMPLETED = "completed",
}

/**
 * Todo work state enum
 */
export enum WorkState {
  IDLE = "idle",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
}

/**
 * Todo entity
 */
export interface Todo {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  workState: WorkState;
  totalWorkTime: number;
  lastStateChangeAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert PrismaTodo to Todo domain entity
 */
export function mapToDomainTodo(prismaTodo: PrismaTodo): Todo {
  return {
    id: prismaTodo.id,
    title: prismaTodo.title,
    description: prismaTodo.description || undefined,
    status: prismaTodo.status as TodoStatus,
    workState: prismaTodo.workState as WorkState,
    totalWorkTime: prismaTodo.totalWorkTime,
    lastStateChangeAt: prismaTodo.lastStateChangeAt,
    createdAt: prismaTodo.createdAt,
    updatedAt: prismaTodo.updatedAt,
  };
}
