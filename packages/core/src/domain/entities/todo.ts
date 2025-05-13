import type { ProjectId } from "./project.js";
// ... existing code ...

export enum TodoStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum WorkState {
  IDLE = "idle",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETED = "completed",
}

export enum PriorityLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export type TodoId = string;

export interface TodoCreateInput {
  title: string;
  description?: string;
  status?: TodoStatus;
  workState?: WorkState;
  totalWorkTime?: number;
  lastStateChangeAt?: Date;
  dueDate?: Date;
  priority?: PriorityLevel;
  projectId?: ProjectId;
  parentId?: TodoId;
}

export class Todo {
  readonly id: TodoId;
  readonly title: string;
  readonly description?: string;
  readonly status: TodoStatus;
  readonly workState: WorkState;
  readonly totalWorkTime: number;
  readonly lastStateChangeAt: Date;
  readonly dueDate?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly priority: PriorityLevel;
  readonly projectId?: ProjectId;
  readonly dependencies: TodoId[];
  readonly dependents: TodoId[];
  readonly parentId?: TodoId;
  readonly subtaskIds: TodoId[];

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
    dueDate?: Date | TodoId[],
    dependencies: TodoId[] = [],
    dependents: TodoId[] = [],
    parentId?: TodoId,
    subtaskIds: TodoId[] = [],
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
    this.parentId = parentId;
    this.subtaskIds = [...subtaskIds];
    if (Array.isArray(dueDate)) {
      this.dueDate = undefined;
      this.dependencies = [...dueDate];
      if (dueDate.length === 0 && dependents.length > 0) {
        this.dependents = [...dependents];
      } else {
        this.dependents = [...dependencies];
      }
    } else {
      this.dueDate = dueDate;
      this.dependencies = [...dependencies];
      this.dependents = [...dependents];
    }
  }
  // ... existing code ...
}
