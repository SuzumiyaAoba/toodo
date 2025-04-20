import type { TodoActivity } from "../entities/todo-activity";

/**
 * TodoActivityRepository interface
 */
export interface TodoActivityRepository {
  /**
   * Find todo activities by todo id
   * @param todoId Todo id
   */
  findByTodoId(todoId: string): Promise<TodoActivity[]>;

  /**
   * Find todo activity by id
   * @param id Activity id
   */
  findById(id: string): Promise<TodoActivity | null>;

  /**
   * Create todo activity
   * @param activity Activity data to create
   */
  create(activity: Omit<TodoActivity, "id" | "createdAt">): Promise<TodoActivity>;

  /**
   * Delete todo activity
   * @param id Activity id
   */
  delete(id: string): Promise<void>;
}
