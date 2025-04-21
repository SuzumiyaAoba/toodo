import * as v from "valibot";
import type { Tag } from "../../../domain/entities/tag";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * Input for assigning a tag to a todo
 */
export type AssignTagToTodoInput = {
  todoId: string;
  tagId: string;
};

/**
 * Schema for assigning a tag to a todo
 */
export const AssignTagToTodoInputSchema = v.object({
  todoId: v.pipe(v.string(), v.uuid("Todo ID must be a valid UUID")),
  tagId: v.pipe(v.string(), v.uuid("Tag ID must be a valid UUID")),
});

/**
 * Use case for assigning a tag to a todo
 */
export class AssignTagToTodoUseCase {
  constructor(
    private tagRepository: TagRepository,
    private todoRepository: TodoRepository,
  ) {}

  /**
   * Execute the use case
   * @param input Input containing todo ID and tag ID
   */
  async execute(input: AssignTagToTodoInput): Promise<void> {
    // Validate input
    const validated = v.parse(AssignTagToTodoInputSchema, input);

    // Check if todo exists
    const todo = await this.todoRepository.findById(validated.todoId);
    if (!todo) {
      throw new Error(`Todo with ID '${validated.todoId}' not found`);
    }

    // Check if tag exists
    const tag = await this.tagRepository.getTagById(validated.tagId);
    if (!tag) {
      throw new Error(`Tag with ID '${validated.tagId}' not found`);
    }

    // Check if tag is already assigned
    const tags = await this.tagRepository.getTagsForTodo(validated.todoId);
    if (tags.some((t) => t.id === validated.tagId)) {
      throw new Error(`Tag '${tag.name}' is already assigned to this todo`);
    }

    // Assign tag to todo
    await this.tagRepository.assignTagToTodo(validated.todoId, validated.tagId);
  }
}

/**
 * Input for getting tags for a todo
 */
export type GetTagsForTodoInput = {
  todoId: string;
};

/**
 * Schema for getting tags for a todo
 */
export const GetTagsForTodoInputSchema = v.object({
  todoId: v.pipe(v.string(), v.uuid("Todo ID must be a valid UUID")),
});

/**
 * Use case for getting tags for a todo
 */
export class GetTagsForTodoUseCase {
  constructor(
    private tagRepository: TagRepository,
    private todoRepository: TodoRepository,
  ) {}

  /**
   * Execute the use case
   * @param input Input containing todo ID
   * @returns List of tags assigned to the todo
   */
  async execute(input: GetTagsForTodoInput): Promise<Tag[]> {
    // Validate input
    const validated = v.parse(GetTagsForTodoInputSchema, input);

    // Check if todo exists
    const todo = await this.todoRepository.findById(validated.todoId);
    if (!todo) {
      throw new Error(`Todo with ID '${validated.todoId}' not found`);
    }

    // Get tags for todo
    return this.tagRepository.getTagsForTodo(validated.todoId);
  }
}
