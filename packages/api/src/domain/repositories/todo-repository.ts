import type { ProjectId } from "../entities/project";
import type { TagId } from "../entities/tag";
import type { Todo, TodoId } from "../entities/todo";

/**
 * TodoRepository interface
 */
export interface TodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: TodoId): Promise<Todo | null>;
  create(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">): Promise<Todo>;
  update(id: TodoId, todo: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">>): Promise<Todo | null>;
  delete(id: TodoId): Promise<void>;
  findByStatus(status: string): Promise<Todo[]>;
  findByPriority(priority: string): Promise<Todo[]>;
  findByProject(projectId: ProjectId): Promise<Todo[]>;
  findByTag(tagId: TagId): Promise<Todo[]>;
  findByDependency(dependencyId: TodoId): Promise<Todo[]>;
  findByDependent(dependentId: TodoId): Promise<Todo[]>;
  findWithDueDateBefore(date: Date): Promise<Todo[]>;
  findWithDueDateBetween(startDate: Date, endDate: Date): Promise<Todo[]>;

  // Subtask related methods
  findByParent(parentId: TodoId): Promise<Todo[]>;
  findChildrenTree(parentId: TodoId, maxDepth?: number): Promise<Todo[]>;
  updateParent(todoId: TodoId, parentId: TodoId | null): Promise<Todo>;
  addSubtask(parentId: TodoId, subtaskId: TodoId): Promise<void>;
  removeSubtask(parentId: TodoId, subtaskId: TodoId): Promise<void>;

  // Cycle check methods
  checkForHierarchyCycle(todoId: TodoId, potentialParentId: TodoId): Promise<boolean>;

  // Dependency management methods
  addDependency(todoId: TodoId, dependencyId: TodoId): Promise<void>;
  removeDependency(todoId: TodoId, dependencyId: TodoId): Promise<void>;
  findDependencies(todoId: TodoId): Promise<Todo[]>;
  findDependents(todoId: TodoId): Promise<Todo[]>;
  wouldCreateDependencyCycle(todoId: TodoId, dependencyId: TodoId): Promise<boolean>;

  // Due date related methods
  findOverdue(currentDate?: Date): Promise<Todo[]>;
  findDueSoon(days?: number, currentDate?: Date): Promise<Todo[]>;
  findByDueDateRange(startDate: Date, endDate: Date): Promise<Todo[]>;

  // Other utility methods
  findAllCompleted(): Promise<Todo[]>;
  findByProjectId(projectId: string): Promise<Todo[]>;
  findByTagId(tagId: string): Promise<Todo[]>;
}
