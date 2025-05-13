import type { ProjectId } from "./project";
// src/domain/entities/test-helpers.ts
import { PriorityLevel, Todo, TodoStatus, WorkState } from "./todo";

/**
 * Creates a Todo instance for testing purposes.
 * This helper ensures that the returned object is a proper Todo instance with all methods.
 */
export function createTestTodo({
  id = "test-todo-id",
  title = "Test Todo",
  description,
  status = TodoStatus.PENDING,
  workState = WorkState.IDLE,
  totalWorkTime = 0,
  lastStateChangeAt = new Date(),
  createdAt = new Date(),
  updatedAt = new Date(),
  priority = PriorityLevel.MEDIUM,
  projectId,
}: {
  id?: string;
  title?: string;
  description?: string;
  status?: TodoStatus;
  workState?: WorkState;
  totalWorkTime?: number;
  lastStateChangeAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  priority?: PriorityLevel;
  projectId?: ProjectId;
} = {}): Todo {
  return new Todo(
    id,
    title,
    status,
    workState,
    totalWorkTime,
    lastStateChangeAt,
    createdAt,
    updatedAt,
    priority,
    projectId,
    description,
  );
}
