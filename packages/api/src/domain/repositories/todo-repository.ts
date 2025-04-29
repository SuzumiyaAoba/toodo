import type { Todo } from "@toodo/core";

/**
 * TodoRepository interface
 */
export interface TodoRepository {
  findAll(): Promise<Todo[]>;
  findById(id: string): Promise<Todo | null>;
  create(todo: Todo): Promise<Todo>;
  update(id: string, todo: Partial<Omit<Todo, "id" | "createdAt" | "updatedAt">>): Promise<Todo | null>;
  delete(id: string): Promise<void>;
  findByState(state: string): Promise<Todo[]>;
  findByProject(projectId: string): Promise<Todo[]>;
  findByTag(tagId: string): Promise<Todo[]>;
  findUnassignedSubtasks(): Promise<Todo[]>;
  findSubtasks(parentId: string): Promise<Todo[]>;
  findByStatus(status: string): Promise<Todo[]>;
  findByPriority(priority: string): Promise<Todo[]>;
  findByDependency(dependencyId: string): Promise<Todo[]>;
  findByDependent(dependentId: string): Promise<Todo[]>;
  findWithDueDateBefore(date: Date): Promise<Todo[]>;
  findWithDueDateBetween(startDate: Date, endDate: Date): Promise<Todo[]>;

  // Subtask related methods
  findByParent(parentId: string): Promise<Todo[]>;
  findChildrenTree(parentId: string, maxDepth?: number): Promise<Todo[]>;
  updateParent(todoId: string, parentId: string | null): Promise<Todo>;
  addSubtask(parentId: string, subtaskId: string): Promise<void>;
  removeSubtask(parentId: string, subtaskId: string): Promise<void>;

  // Cycle check methods
  checkForHierarchyCycle(todoId: string, potentialParentId: string): Promise<boolean>;

  // Dependency management methods
  addDependency(todoId: string, dependencyId: string): Promise<void>;
  removeDependency(todoId: string, dependencyId: string): Promise<void>;
  findDependencies(todoId: string): Promise<Todo[]>;
  findDependents(todoId: string): Promise<Todo[]>;
  wouldCreateDependencyCycle(todoId: string, dependencyId: string): Promise<boolean>;

  // Due date related methods
  findOverdue(currentDate?: Date): Promise<Todo[]>;
  findDueSoon(days?: number, currentDate?: Date): Promise<Todo[]>;
  findByDueDateRange(startDate: Date, endDate: Date): Promise<Todo[]>;

  // Other utility methods
  findAllCompleted(): Promise<Todo[]>;
  findByProjectId(projectId: string): Promise<Todo[]>;
  findByTagId(tagId: string): Promise<Todo[]>;
}
