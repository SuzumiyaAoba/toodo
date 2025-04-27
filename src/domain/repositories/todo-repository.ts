import type { Todo, TodoId } from "../entities/todo";

/**
 * TodoRepository interface
 */
export interface TodoRepository {
  /**
   * Find all todos
   */
  findAll(): Promise<Todo[]>;

  /**
   * Find todo by id
   * @param id Todo id
   */
  findById(id: string): Promise<Todo | null>;

  /**
   * Create todo
   * @param todo Todo data to create
   */
  create(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">): Promise<Todo>;

  /**
   * Update todo
   * @param id Todo id
   * @param todo Todo data to update
   */
  update(id: string, todo: Partial<Todo>): Promise<Todo | null>;

  /**
   * Delete todo
   * @param id Todo id
   */
  delete(id: string): Promise<void>;

  /**
   * Add dependency relationship between todos
   * @param todoId ID of the todo that depends on another todo
   * @param dependencyId ID of the todo that is depended on
   */
  addDependency(todoId: TodoId, dependencyId: TodoId): Promise<void>;

  /**
   * Remove dependency relationship between todos
   * @param todoId ID of the todo that depends on another todo
   * @param dependencyId ID of the todo that is depended on
   */
  removeDependency(todoId: TodoId, dependencyId: TodoId): Promise<void>;

  /**
   * Find todos that depend on the specified todo
   * @param todoId ID of the todo to find dependents for
   */
  findDependents(todoId: TodoId): Promise<Todo[]>;

  /**
   * Find todos that the specified todo depends on
   * @param todoId ID of the todo to find dependencies for
   */
  findDependencies(todoId: TodoId): Promise<Todo[]>;

  /**
   * Check if adding a dependency would create a cycle
   * @param todoId ID of the todo that would depend on another
   * @param dependencyId ID of the todo that would be depended on
   * @returns true if adding the dependency would create a cycle
   */
  wouldCreateDependencyCycle(todoId: TodoId, dependencyId: TodoId): Promise<boolean>;

  /**
   * Get all completed todos
   */
  findAllCompleted(): Promise<Todo[]>;
}
