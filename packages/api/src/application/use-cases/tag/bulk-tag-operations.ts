import * as v from "valibot";
import type { Tag } from "../../../domain/entities/tag";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * Input for bulk assigning a tag to multiple todos
 */
export type BulkAssignTagInput = {
  tagId: string;
  todoIds: string[];
};

/**
 * Schema for bulk assigning a tag to multiple todos
 */
export const BulkAssignTagInputSchema = v.object({
  tagId: v.pipe(v.string(), v.uuid("Tag ID must be a valid UUID")),
  todoIds: v.array(v.pipe(v.string(), v.uuid("Todo ID must be a valid UUID"))),
});

/**
 * Output for bulk tag operations
 */
export type BulkTagOperationOutput = {
  success: boolean;
  message: string;
  tag: {
    id: string;
    name: string;
    color: string | null;
  };
  assignedCount?: number;
  removedCount?: number;
};

/**
 * Use case for bulk assigning a tag to multiple todos
 */
export class BulkAssignTagUseCase {
  constructor(
    private tagRepository: TagRepository,
    private todoRepository: TodoRepository,
  ) {}

  /**
   * Execute the use case
   * @param input Input containing tag ID and todo IDs
   * @returns Information about the operation results
   */
  async execute(input: BulkAssignTagInput): Promise<BulkTagOperationOutput> {
    // Validate input
    const validated = v.parse(BulkAssignTagInputSchema, input);

    if (validated.todoIds.length === 0) {
      return {
        success: true,
        message: "No todos specified for tag assignment",
        tag: {
          id: validated.tagId,
          name: "",
          color: null,
        },
        assignedCount: 0,
      };
    }

    // Verify tag exists
    const tag = await this.tagRepository.getTagById(validated.tagId);
    if (!tag) {
      throw new Error(`Tag with ID '${validated.tagId}' not found`);
    }

    // Verify all todos exist
    for (const todoId of validated.todoIds) {
      const todo = await this.todoRepository.findById(todoId);
      if (!todo) {
        throw new Error(`Todo with ID '${todoId}' not found`);
      }
    }

    // Bulk assign tag to todos
    const assignedCount = await this.tagRepository.bulkAssignTagToTodos(validated.tagId, validated.todoIds);

    return {
      success: true,
      message: `Tag assigned to ${assignedCount} todos`,
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color as string | null,
      },
      assignedCount,
    };
  }
}

/**
 * Input for bulk removing a tag from multiple todos
 */
export type BulkRemoveTagInput = {
  tagId: string;
  todoIds: string[];
};

/**
 * Schema for bulk removing a tag from multiple todos
 */
export const BulkRemoveTagInputSchema = v.object({
  tagId: v.pipe(v.string(), v.uuid("Tag ID must be a valid UUID")),
  todoIds: v.array(v.pipe(v.string(), v.uuid("Todo ID must be a valid UUID"))),
});

/**
 * Use case for bulk removing a tag from multiple todos
 */
export class BulkRemoveTagUseCase {
  constructor(
    private tagRepository: TagRepository,
    private todoRepository: TodoRepository,
  ) {}

  /**
   * Execute the use case
   * @param input Input containing tag ID and todo IDs
   * @returns Information about the operation results
   */
  async execute(input: BulkRemoveTagInput): Promise<BulkTagOperationOutput> {
    // Validate input
    const validated = v.parse(BulkRemoveTagInputSchema, input);

    if (validated.todoIds.length === 0) {
      return {
        success: true,
        message: "No todos specified for tag removal",
        tag: {
          id: validated.tagId,
          name: "",
          color: null,
        },
        removedCount: 0,
      };
    }

    // Verify tag exists
    const tag = await this.tagRepository.getTagById(validated.tagId);
    if (!tag) {
      throw new Error(`Tag with ID '${validated.tagId}' not found`);
    }

    // Verify all todos exist
    for (const todoId of validated.todoIds) {
      const todo = await this.todoRepository.findById(todoId);
      if (!todo) {
        throw new Error(`Todo with ID '${todoId}' not found`);
      }
    }

    // Bulk remove tag from todos
    const removedCount = await this.tagRepository.bulkRemoveTagFromTodos(validated.tagId, validated.todoIds);

    return {
      success: true,
      message: `Tag removed from ${removedCount} todos`,
      tag: {
        id: tag.id,
        name: tag.name,
        color: tag.color as string | null,
      },
      removedCount,
    };
  }
}
