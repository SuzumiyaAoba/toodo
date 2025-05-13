import type { Todo as PrismaTodo } from "../../generated/prisma";
import type { ProjectId } from "./project";

/**
 * Todo status enum
 */
export enum TodoStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
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
  readonly dependencies: TodoId[];
  readonly dependents: TodoId[];

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
    dependencies: TodoId[] = [],
    dependents: TodoId[] = [],
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
    this.dependencies = [...dependencies];
    this.dependents = [...dependents];
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
      [],
      [],
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
    dependencies = this.dependencies,
    dependents = this.dependents,
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
      dependencies,
      dependents,
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
  complete(currentTime: Date = new Date()): Todo {
    if (this.status === TodoStatus.COMPLETED) {
      throw new Error("Todo is already completed");
    }

    let totalWorkTime = this.totalWorkTime;

    // If the todo is in the ACTIVE state, calculate the time spent working
    if (this.workState === WorkState.ACTIVE) {
      const timeSpent = Math.floor((currentTime.getTime() - this.lastStateChangeAt.getTime()) / 1000);
      totalWorkTime += timeSpent;
    }

    return this.copyWith({
      status: TodoStatus.COMPLETED,
      workState: WorkState.COMPLETED,
      totalWorkTime: totalWorkTime,
      lastStateChangeAt: currentTime,
      updatedAt: currentTime,
    });
  }

  /**
   * Mark the todo as pending
   */
  reopen(currentTime: Date = new Date()): Todo {
    if (this.status !== TodoStatus.COMPLETED) {
      throw new Error("Todo is not completed");
    }

    return this.copyWith({
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      lastStateChangeAt: currentTime,
      updatedAt: currentTime,
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
   * Start working on a todo
   */
  start(currentTime: Date = new Date()): Todo {
    if (this.status === TodoStatus.COMPLETED) {
      throw new Error("Cannot start a completed todo");
    }
    if (this.workState === WorkState.ACTIVE) {
      throw new Error("Todo is already in WORKING state");
    }
    return this.updateWorkState(WorkState.ACTIVE, currentTime).updateStatus(TodoStatus.IN_PROGRESS);
  }

  /**
   * Pause working on a todo
   */
  pause(currentTime: Date = new Date()): Todo {
    if (this.workState !== WorkState.ACTIVE) {
      throw new Error("Todo is not in WORKING state");
    }

    // Calculate time spent working
    const timeSpent = Math.floor((currentTime.getTime() - this.lastStateChangeAt.getTime()) / 1000);

    return this.copyWith({
      workState: WorkState.PAUSED,
      totalWorkTime: this.totalWorkTime + timeSpent,
      lastStateChangeAt: currentTime,
      updatedAt: currentTime,
    });
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

  /**
   * Update multiple properties of the todo at once
   */
  update(data: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">>): Todo {
    return this.copyWith(data);
  }

  /**
   * Resume working on a paused todo
   */
  resume(currentTime: Date = new Date()): Todo {
    if (this.workState !== WorkState.PAUSED) {
      throw new Error("Todo is not in PAUSED state");
    }
    return this.updateWorkState(WorkState.ACTIVE, currentTime);
  }

  /**
   * Add a dependency to this Todo
   * @param dependencyId The ID of the Todo this Todo depends on
   */
  addDependency(dependencyId: TodoId): Todo {
    // 自分自身への依存関係は追加できない
    if (dependencyId === this.id) {
      throw new Error("A todo cannot depend on itself");
    }

    // すでに依存関係がある場合は追加しない
    if (this.dependencies.includes(dependencyId)) {
      return this;
    }

    const updatedDependencies = [...this.dependencies, dependencyId];
    return this.copyWith({ dependencies: updatedDependencies });
  }

  /**
   * Remove a dependency from this Todo
   * @param dependencyId The ID of the Todo to remove from dependencies
   */
  removeDependency(dependencyId: TodoId): Todo {
    const updatedDependencies = this.dependencies.filter((id) => id !== dependencyId);

    // 依存関係が変わらない場合は同じインスタンスを返す
    if (updatedDependencies.length === this.dependencies.length) {
      return this;
    }

    return this.copyWith({ dependencies: updatedDependencies });
  }

  /**
   * Add a dependent to this Todo
   * @param dependentId The ID of the Todo that depends on this Todo
   */
  addDependent(dependentId: TodoId): Todo {
    // 自分自身への依存関係は追加できない
    if (dependentId === this.id) {
      throw new Error("A todo cannot depend on itself");
    }

    // すでに依存関係がある場合は追加しない
    if (this.dependents.includes(dependentId)) {
      return this;
    }

    const updatedDependents = [...this.dependents, dependentId];
    return this.copyWith({ dependents: updatedDependents });
  }

  /**
   * Remove a dependent from this Todo
   * @param dependentId The ID of the Todo to remove from dependents
   */
  removeDependent(dependentId: TodoId): Todo {
    const updatedDependents = this.dependents.filter((id) => id !== dependentId);

    // 依存関係が変わらない場合は同じインスタンスを返す
    if (updatedDependents.length === this.dependents.length) {
      return this;
    }

    return this.copyWith({ dependents: updatedDependents });
  }

  /**
   * Check if this Todo has a dependency on another Todo
   * @param dependencyId The ID of the Todo to check
   */
  hasDependencyOn(dependencyId: TodoId): boolean {
    return this.dependencies.includes(dependencyId);
  }

  /**
   * Check if this Todo has a dependent Todo
   * @param dependentId The ID of the Todo to check
   */
  hasDependent(dependentId: TodoId): boolean {
    return this.dependents.includes(dependentId);
  }

  /**
   * Check if this Todo can be completed based on its dependencies
   * @param completedTodoIds Array of IDs of completed Todos
   */
  canBeCompleted(completedTodoIds: TodoId[]): boolean {
    // 依存関係がない場合は完了できる
    if (this.dependencies.length === 0) {
      return true;
    }

    // すべての依存先Todoが完了しているかチェック
    return this.dependencies.every((dependencyId) => completedTodoIds.includes(dependencyId));
  }
}

/**
 * Convert WorkState enum to a string representation
 */
export function workStateToString(workState: WorkState): string {
  switch (workState) {
    case WorkState.IDLE:
      return "Idle";
    case WorkState.ACTIVE:
      return "Active";
    case WorkState.PAUSED:
      return "Paused";
    case WorkState.COMPLETED:
      return "Completed";
    default:
      return "Unknown";
  }
}

/**
 * Convert TodoStatus enum to a string representation
 */
export function todoStatusToString(status: TodoStatus): string {
  switch (status) {
    case TodoStatus.PENDING:
      return "Pending";
    case TodoStatus.IN_PROGRESS:
      return "In Progress";
    case TodoStatus.COMPLETED:
      return "Completed";
    default:
      return "Unknown";
  }
}

/**
 * Convert PriorityLevel enum to a string representation
 */
export function priorityLevelToString(priorityLevel: PriorityLevel): string {
  switch (priorityLevel) {
    case PriorityLevel.LOW:
      return "Low";
    case PriorityLevel.MEDIUM:
      return "Medium";
    case PriorityLevel.HIGH:
      return "High";
    default:
      return "Unknown";
  }
}

/**
 * Convert PrismaTodo to Todo domain entity
 */
export function mapToDomainTodo(
  prismaTodo: PrismaTodo & {
    dependsOn?: { dependencyId: string }[];
    dependents?: { dependentId: string }[];
  },
): Todo {
  // 依存関係のIDを抽出
  const dependencies = prismaTodo.dependsOn?.map((dep) => dep.dependencyId) || [];
  const dependents = prismaTodo.dependents?.map((dep) => dep.dependentId) || [];

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
    dependencies,
    dependents,
  );
}
