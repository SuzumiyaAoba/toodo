import type { Tag } from "../entities/tag";

/**
 * Interface for tag repository
 */
export interface TagRepository {
  /**
   * Create a new tag
   */
  createTag(name: string, color?: string): Promise<Tag>;

  /**
   * Get a tag by ID
   */
  getTagById(id: string): Promise<Tag | null>;

  /**
   * Get a tag by name
   */
  getTagByName(name: string): Promise<Tag | null>;

  /**
   * Get all tags
   */
  getAllTags(): Promise<Tag[]>;

  /**
   * Update a tag
   */
  updateTag(id: string, name?: string, color?: string): Promise<Tag>;

  /**
   * Delete a tag
   */
  deleteTag(id: string): Promise<void>;

  /**
   * Assign a tag to a todo
   */
  assignTagToTodo(todoId: string, tagId: string): Promise<void>;

  /**
   * Remove a tag from a todo
   */
  removeTagFromTodo(todoId: string, tagId: string): Promise<void>;

  /**
   * Get tags for a todo
   */
  getTagsForTodo(todoId: string): Promise<Tag[]>;

  /**
   * Get todos for a tag
   */
  getTodoIdsForTag(tagId: string): Promise<string[]>;
}
