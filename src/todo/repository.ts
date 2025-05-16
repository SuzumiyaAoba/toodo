import { Todo } from "./model";

/**
 * Repository interface for Todo entities
 * Provides abstraction for database access and separates domain logic from data access
 */
export interface TodoRepository {
  /**
   * Retrieves all Todos
   * @returns Array of Todo entities
   */
  findAll(): Promise<Todo[]>;

  /**
   * Finds a Todo by its ID
   * @param id ID of the Todo to find
   * @returns Found Todo entity, or null if not found
   */
  findById(id: string): Promise<Todo | null>;

  /**
   * Saves a Todo (creates new or updates existing)
   * @param todo Todo entity to save
   * @returns Saved Todo entity
   */
  save(todo: Todo): Promise<Todo>;

  /**
   * Deletes a Todo
   * @param id ID of the Todo to delete
   */
  delete(id: string): Promise<void>;
}
