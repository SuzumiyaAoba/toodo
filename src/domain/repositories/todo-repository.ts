import type { Todo } from "../entities/todo";

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
}
