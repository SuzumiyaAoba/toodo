import type { Tag } from "@toodo/core";

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

  /**
   * Get todos that have all the specified tags
   */
  getTodoIdsWithAllTags(tagIds: string[]): Promise<string[]>;

  /**
   * Get todos that have any of the specified tags
   */
  getTodoIdsWithAnyTag(tagIds: string[]): Promise<string[]>;

  /**
   * Bulk assign a tag to multiple todos
   */
  bulkAssignTagToTodos(tagId: string, todoIds: string[]): Promise<number>;

  /**
   * Bulk remove a tag from multiple todos
   */
  bulkRemoveTagFromTodos(tagId: string, todoIds: string[]): Promise<number>;

  /**
   * Get tag usage statistics
   */
  getTagStatistics(): Promise<
    Array<{
      id: string;
      name: string;
      color: string | null;
      usageCount: number;
      pendingTodoCount: number;
      completedTodoCount: number;
    }>
  >;

  findAll(): Promise<Tag[]>;
  findById(id: string): Promise<Tag | null>;
  create(tag: Tag): Promise<Tag>;
  update(tag: Tag): Promise<Tag>;
  delete(id: string): Promise<void>;
  findByName(name: string): Promise<Tag | null>;
  getTodosByTagId(id: string): Promise<string[]>;
  addTagToTodo(tagId: string, todoId: string): Promise<void>;
  removeTagFromTodo(tagId: string, todoId: string): Promise<void>;
}
