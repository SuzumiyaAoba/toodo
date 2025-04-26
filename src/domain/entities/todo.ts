import type { Todo as PrismaTodo } from "../../generated/prisma";
import type { ProjectId } from "./project";

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
 * Todo priority level enum
 */
export enum PriorityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

/**
 * Todo ID type
 */
export type TodoId = string;

/**
 * Input type for creating a new Todo entity
 */
export interface TodoCreateInput {
  title: string;
  description?: string;
  status?: TodoStatus;
  workState?: WorkState;
  totalWorkTime?: number;
  lastStateChangeAt?: Date;
  priority?: PriorityLevel;
  projectId?: ProjectId;
}

/**
 * Todo entity
 */
export class Todo {
  readonly id: TodoId;
  readonly title: string;
  readonly description?: string;
  readonly status: TodoStatus;
  readonly workState: WorkState;
  readonly totalWorkTime: number;
  readonly lastStateChangeAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly priority: PriorityLevel;
  readonly projectId?: ProjectId;

  constructor(
    id: TodoId,
    title: string,
    status: TodoStatus = TodoStatus.PENDING,
    workState: WorkState = WorkState.IDLE,
    totalWorkTime = 0,
    lastStateChangeAt: Date = new Date(),
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    priority: PriorityLevel = PriorityLevel.MEDIUM,
    projectId?: ProjectId,
    description?: string,
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = status;
    this.workState = workState;
    this.totalWorkTime = totalWorkTime;
    this.lastStateChangeAt = lastStateChangeAt;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.priority = priority;
    this.projectId = projectId;
  }

  /**
   * Create a new Todo entity without an ID, createdAt, and updatedAt
   * for use with repository create methods
   */
  static createNew(input: TodoCreateInput): Omit<Todo, "id" | "createdAt" | "updatedAt"> {
    const now = new Date();
    // ダミーのIDを使って完全なTodoインスタンスを作成
    const todo = new Todo(
      "temp-id",
      input.title,
      input.status ?? TodoStatus.PENDING,
      input.workState ?? WorkState.IDLE,
      input.totalWorkTime ?? 0,
      input.lastStateChangeAt ?? now,
      now,
      now,
      input.priority ?? PriorityLevel.MEDIUM,
      input.projectId,
      input.description,
    );

    // id, createdAt, updatedAtを除外した新しいオブジェクトを返す
    const { id, createdAt, updatedAt, ...todoData } = todo;
    return todo;
  }

  /**
   * Create a new Todo instance with updated properties
   */
  private copyWith({
    id = this.id,
    title = this.title,
    description = this.description,
    status = this.status,
    workState = this.workState,
    totalWorkTime = this.totalWorkTime,
    lastStateChangeAt = this.lastStateChangeAt,
    createdAt = this.createdAt,
    updatedAt = new Date(),
    priority = this.priority,
    projectId = this.projectId,
  }: Partial<Todo>): Todo {
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

  /**
   * Update the title of the todo
   */
  updateTitle(title: string): Todo {
    return this.copyWith({ title });
  }

  /**
   * Update the description of the todo
   */
  updateDescription(description?: string): Todo {
    return this.copyWith({ description });
  }

  /**
   * Update the status of the todo
   */
  updateStatus(status: TodoStatus): Todo {
    return this.copyWith({ status });
  }

  /**
   * Mark the todo as completed
   */
  complete(): Todo {
    return this.copyWith({
      status: TodoStatus.COMPLETED,
      workState: WorkState.COMPLETED,
    });
  }

  /**
   * Mark the todo as pending
   */
  reopen(): Todo {
    return this.copyWith({
      status: TodoStatus.PENDING,
      workState: this.workState === WorkState.COMPLETED ? WorkState.IDLE : this.workState,
    });
  }

  /**
   * Update the work state of the todo
   */
  updateWorkState(workState: WorkState, currentTime: Date = new Date()): Todo {
    let additionalWorkTime = 0;

    // If transitioning from active to another state, calculate work time
    if (this.workState === WorkState.ACTIVE && workState !== WorkState.ACTIVE) {
      additionalWorkTime = Math.floor((currentTime.getTime() - this.lastStateChangeAt.getTime()) / 1000);
    }

    return this.copyWith({
      workState,
      totalWorkTime: this.totalWorkTime + additionalWorkTime,
      lastStateChangeAt: currentTime,
    });
  }

  /**
   * Start working on the todo
   */
  start(currentTime: Date = new Date()): Todo {
    return this.updateWorkState(WorkState.ACTIVE, currentTime);
  }

  /**
   * Pause working on the todo
   */
  pause(currentTime: Date = new Date()): Todo {
    return this.updateWorkState(WorkState.PAUSED, currentTime);
  }

  /**
   * Update the priority of the todo
   */
  updatePriority(priority: PriorityLevel): Todo {
    return this.copyWith({ priority });
  }

  /**
   * Assign the todo to a project
   */
  assignToProject(projectId: ProjectId): Todo {
    return this.copyWith({ projectId });
  }

  /**
   * Remove the todo from its project
   */
  removeFromProject(): Todo {
    // Create a copy with projectId explicitly set to undefined, bypassing copyWith defaults
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(), // updatedAt
      this.priority,
      undefined, // explicitly set projectId to undefined
      this.description,
    );
  }
}

/**
 * Convert PrismaTodo to Todo domain entity
 */
export function mapToDomainTodo(prismaTodo: PrismaTodo): Todo {
  return new Todo(
    prismaTodo.id,
    prismaTodo.title,
    prismaTodo.status as TodoStatus,
    prismaTodo.workState as WorkState,
    prismaTodo.totalWorkTime,
    prismaTodo.lastStateChangeAt,
    prismaTodo.createdAt,
    prismaTodo.updatedAt,
    prismaTodo.priority as PriorityLevel,
    prismaTodo.projectId || undefined,
    prismaTodo.description || undefined,
  );
}
