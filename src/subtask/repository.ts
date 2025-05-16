import { Subtask } from "./model";

/**
 * Repository interface for Subtask entities
 * Provides abstraction for database access and separates domain logic from data access
 */
export interface SubtaskRepository {
  /**
   * Retrieves all Subtasks belonging to a specific Todo
   * @param todoId ID of the parent Todo
   * @returns Array of Subtask entities
   */
  findByTodoId(todoId: string): Promise<Subtask[]>;

  /**
   * Finds a Subtask by its ID
   * @param id ID of the Subtask to find
   * @returns Found Subtask entity, or null if not found
   */
  findById(id: string): Promise<Subtask | null>;

  /**
   * Saves a Subtask (creates new or updates existing)
   * @param subtask Subtask entity to save
   * @returns Saved Subtask entity
   */
  save(subtask: Subtask): Promise<Subtask>;

  /**
   * Deletes a Subtask
   * @param id ID of the Subtask to delete
   */
  delete(id: string): Promise<void>;

  /**
   * Updates the order of multiple Subtasks
   * @param subtasks Array of Subtask entities to update
   * @returns Array of updated Subtask entities
   */
  updateOrder(subtasks: Subtask[]): Promise<Subtask[]>;
}
