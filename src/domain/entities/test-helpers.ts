import { mock } from "bun:test";
import type { ProjectRepository } from "../repositories/project-repository";
import type { TodoRepository } from "../repositories/todo-repository";
import type { Project } from "./project";
import type { PriorityLevel, Todo, TodoStatus, WorkState } from "./todo";

/**
 * テスト用のTodoオブジェクトを作成する
 */
export function createTestTodo(params: {
  id: string;
  title: string;
  description?: string;
  status?: TodoStatus;
  workState?: WorkState;
  totalWorkTime?: number;
  lastStateChangeAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  priority?: PriorityLevel;
  projectId?: string;
  dueDate?: Date;
  dependencies?: string[];
  dependents?: string[];
}): Todo {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    status: params.status ?? "pending",
    workState: params.workState ?? "idle",
    totalWorkTime: params.totalWorkTime ?? 0,
    lastStateChangeAt: params.lastStateChangeAt ?? new Date(),
    createdAt: params.createdAt ?? new Date(),
    updatedAt: params.updatedAt ?? new Date(),
    priority: params.priority ?? "medium",
    projectId: params.projectId,
    dueDate: params.dueDate,
    dependencies: params.dependencies ?? [],
    dependents: params.dependents ?? [],
  } as Todo;
}

/**
 * Prisma用のモックTodoオブジェクトを作成
 */
export function createMockPrismaTodo(params: {
  id: string;
  title: string;
  description?: string | null;
  status?: string;
  workState?: string;
  totalWorkTime?: number;
  lastStateChangeAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  priority?: string;
  projectId?: string | null;
  dueDate?: Date | null;
  dependsOn?: { dependencyId: string }[];
  dependents?: { dependentId: string }[];
}) {
  return {
    id: params.id,
    title: params.title,
    description: params.description ?? null,
    status: params.status ?? "pending",
    workState: params.workState ?? "idle",
    totalWorkTime: params.totalWorkTime ?? 0,
    lastStateChangeAt: params.lastStateChangeAt ?? new Date(),
    createdAt: params.createdAt ?? new Date(),
    updatedAt: params.updatedAt ?? new Date(),
    priority: params.priority ?? "medium",
    projectId: params.projectId ?? null,
    dueDate: params.dueDate ?? null,
    dependsOn: params.dependsOn ?? [],
    dependents: params.dependents ?? [],
  };
}

/**
 * 優先度をPrisma用の文字列に変換
 */
export function priorityLevelToString(priority: PriorityLevel): string {
  return priority.toString().toLowerCase();
}

/**
 * Todoステータスをプリズマ用の文字列に変換
 */
export function todoStatusToString(status: TodoStatus): string {
  return status.toString().toLowerCase();
}

/**
 * 作業状態をプリズマ用の文字列に変換
 */
export function workStateToString(state: WorkState): string {
  return state.toString().toLowerCase();
}

/**
 * モック化したTodoRepositoryを作成する
 */
export function createMockedTodoRepository(): TodoRepository {
  return {
    create: mock(() => Promise.resolve({} as Todo)),
    update: mock(() => Promise.resolve({} as Todo)),
    findById: mock(() => Promise.resolve(null)),
    findAll: mock(() => Promise.resolve([])),
    delete: mock(() => Promise.resolve()),
    findByProjectId: mock(() => Promise.resolve([])),
    findByTagId: mock(() => Promise.resolve([])),
    findDependencies: mock(() => Promise.resolve([])),
    findDependents: mock(() => Promise.resolve([])),
    addDependency: mock(() => Promise.resolve()),
    removeDependency: mock(() => Promise.resolve()),
    wouldCreateDependencyCycle: mock(() => Promise.resolve(false)),
    findAllCompleted: mock(() => Promise.resolve([])),
    // 新しいメソッドを追加
    findOverdue: mock(() => Promise.resolve([])),
    findDueSoon: mock(() => Promise.resolve([])),
    findByDueDateRange: mock(() => Promise.resolve([])),
  };
}

/**
 * モック化したProjectRepositoryを作成する
 */
export function createMockedProjectRepository(): ProjectRepository {
  return {
    create: mock(() => Promise.resolve({} as Project)),
    findById: mock(() => Promise.resolve(null)),
    findByName: mock(() => Promise.resolve(null)),
    findAll: mock(() => Promise.resolve([])),
    update: mock(() => Promise.resolve({} as Project)),
    delete: mock(() => Promise.resolve()),
    findTodosByProjectId: mock(() => Promise.resolve([])),
  };
}
