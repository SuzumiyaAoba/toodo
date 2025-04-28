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

  updateTitle(title: string): Todo {
    if (this.title === title) return this;
    return new Todo(
      this.id,
      title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  updateDescription(description?: string): Todo {
    if (this.description === description) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  updateStatus(status: TodoStatus): Todo {
    if (this.status === status) return this;
    return new Todo(
      this.id,
      this.title,
      status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  complete(): Todo {
    if (this.status === TodoStatus.COMPLETED && this.workState === WorkState.COMPLETED) return this;
    return new Todo(
      this.id,
      this.title,
      TodoStatus.COMPLETED,
      WorkState.COMPLETED,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  reopen(): Todo {
    if (this.status === TodoStatus.PENDING && this.workState === WorkState.IDLE) return this;
    return new Todo(
      this.id,
      this.title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  updateWorkState(workState: WorkState, changedAt: Date): Todo {
    if (this.workState === workState && this.lastStateChangeAt.getTime() === changedAt.getTime()) return this;
    let totalWorkTime = this.totalWorkTime;
    if (this.workState === WorkState.ACTIVE && workState !== WorkState.ACTIVE) {
      totalWorkTime += Math.floor((changedAt.getTime() - this.lastStateChangeAt.getTime()) / 1000);
    }
    return new Todo(
      this.id,
      this.title,
      this.status,
      workState,
      totalWorkTime,
      changedAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  start(startTime: Date): Todo {
    if (this.workState === WorkState.ACTIVE) return this;
    return this.updateWorkState(WorkState.ACTIVE, startTime);
  }

  pause(pauseTime: Date): Todo {
    if (this.workState !== WorkState.ACTIVE) return this;
    return this.updateWorkState(WorkState.PAUSED, pauseTime);
  }

  updatePriority(priority: PriorityLevel): Todo {
    if (this.priority === priority) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  assignToProject(projectId: ProjectId): Todo {
    if (this.projectId === projectId) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  removeFromProject(): Todo {
    if (!this.projectId) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      undefined,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  addSubtask(subtaskId: TodoId): Todo {
    if (subtaskId === this.id) throw new Error("A todo cannot be a subtask of itself");
    if (this.subtaskIds.includes(subtaskId)) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      [...this.subtaskIds, subtaskId],
    );
  }

  removeSubtask(subtaskId: TodoId): Todo {
    if (!this.subtaskIds.includes(subtaskId)) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds.filter((id) => id !== subtaskId),
    );
  }

  setParent(parentId: TodoId): Todo {
    if (parentId === this.id) throw new Error("A todo cannot be a parent of itself");
    if (this.parentId === parentId) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      parentId,
      this.subtaskIds,
    );
  }

  removeParent(): Todo {
    if (!this.parentId) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      this.dueDate,
      this.dependencies,
      this.dependents,
      undefined,
      this.subtaskIds,
    );
  }

  areAllSubtasksCompleted(completedTodoIds: TodoId[]): boolean {
    return this.subtaskIds.every((id) => completedTodoIds.includes(id));
  }

  hasSubtask(subtaskId: TodoId): boolean {
    return this.subtaskIds.includes(subtaskId);
  }

  hasParent(): boolean {
    return !!this.parentId;
  }

  isParentOf(subtaskId: TodoId): boolean {
    return this.subtaskIds.includes(subtaskId);
  }

  isChildOf(parentId: TodoId): boolean {
    return this.parentId === parentId;
  }

  updateDueDate(dueDate?: Date): Todo {
    if (this.dueDate?.getTime() === dueDate?.getTime()) return this;
    return new Todo(
      this.id,
      this.title,
      this.status,
      this.workState,
      this.totalWorkTime,
      this.lastStateChangeAt,
      this.createdAt,
      new Date(),
      this.priority,
      this.projectId,
      this.description,
      dueDate,
      this.dependencies,
      this.dependents,
      this.parentId,
      this.subtaskIds,
    );
  }

  isOverdue(currentDate: Date = new Date()): boolean {
    if (!this.dueDate || this.status === TodoStatus.COMPLETED) return false;
    return this.dueDate.getTime() < currentDate.getTime();
  }

  isDueSoon(days = 2, currentDate: Date = new Date()): boolean {
    if (!this.dueDate || this.status === TodoStatus.COMPLETED) return false;
    const diff = (this.dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= days;
  }

  hasDependencyOn(dependencyId: TodoId): boolean {
    return this.dependencies.includes(dependencyId);
  }

  static createNew(
    input: TodoCreateInput & {
      id: TodoId;
      createdAt?: Date;
      updatedAt?: Date;
      dependencies?: TodoId[];
      dependents?: TodoId[];
      subtaskIds?: TodoId[];
    },
  ): Todo {
    return new Todo(
      input.id,
      input.title,
      input.status ?? TodoStatus.PENDING,
      input.workState ?? WorkState.IDLE,
      input.totalWorkTime ?? 0,
      input.lastStateChangeAt ?? new Date(),
      input.createdAt ?? new Date(),
      input.updatedAt ?? new Date(),
      input.priority ?? PriorityLevel.MEDIUM,
      input.projectId,
      input.description,
      input.dueDate,
      input.dependencies ?? [],
      input.dependents ?? [],
      input.parentId,
      input.subtaskIds ?? [],
    );
  }
}

// Define type aliases to avoid direct import of api package types from core package
type DomainPrismaTodo = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  workState: string;
  totalWorkTime: number;
  lastStateChangeAt: Date | string;
  dueDate?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  priority: string;
  projectId?: string | null;
  parentId?: string | null;
};

export function mapToDomainTodo(
  prismaTodo: DomainPrismaTodo & {
    dependsOn?: { dependencyId: string }[];
    dependents?: { dependentId: string }[];
    subtasks?: DomainPrismaTodo[];
  },
): Todo {
  return new Todo(
    prismaTodo.id,
    prismaTodo.title,
    prismaTodo.status as TodoStatus,
    prismaTodo.workState as WorkState,
    prismaTodo.totalWorkTime,
    prismaTodo.lastStateChangeAt ? new Date(prismaTodo.lastStateChangeAt) : new Date(),
    prismaTodo.createdAt ? new Date(prismaTodo.createdAt) : new Date(),
    prismaTodo.updatedAt ? new Date(prismaTodo.updatedAt) : new Date(),
    prismaTodo.priority as PriorityLevel,
    prismaTodo.projectId ?? undefined,
    prismaTodo.description ?? undefined,
    prismaTodo.dueDate ? new Date(prismaTodo.dueDate) : undefined,
    prismaTodo.dependsOn ? prismaTodo.dependsOn.map((d: { dependencyId: string }) => d.dependencyId) : [],
    prismaTodo.dependents ? prismaTodo.dependents.map((d: { dependentId: string }) => d.dependentId) : [],
    prismaTodo.parentId ?? undefined,
    prismaTodo.subtasks ? prismaTodo.subtasks.map((s: DomainPrismaTodo) => s.id) : [],
  );
}
