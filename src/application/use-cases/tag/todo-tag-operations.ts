import * as v from "valibot";
import type { Todo } from "../../../domain/entities/todo";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * Input for removing a tag from a todo
 */
export type RemoveTagFromTodoInput = {
  todoId: string;
  tagId: string;
};

/**
 * Schema for removing a tag from a todo
 */
export const RemoveTagFromTodoInputSchema = v.object({
  todoId: v.pipe(v.string(), v.uuid("Todo ID must be a valid UUID")),
  tagId: v.pipe(v.string(), v.uuid("Tag ID must be a valid UUID")),
});

/**
 * Use case for removing a tag from a todo
 */
export class RemoveTagFromTodoUseCase {
  constructor(
    private tagRepository: TagRepository,
    private todoRepository: TodoRepository,
  ) {}

  /**
   * Execute the use case
   * @param input Input containing todo ID and tag ID
   */
  async execute(input: RemoveTagFromTodoInput): Promise<void> {
    // Validate input
    const validated = v.parse(RemoveTagFromTodoInputSchema, input);

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

    // Check if tag is assigned to todo
    const tags = await this.tagRepository.getTagsForTodo(validated.todoId);
    if (!tags.some((t) => t.id === validated.tagId)) {
      throw new Error(`Tag '${tag.name}' is not assigned to this todo`);
    }

    // Remove tag from todo
    await this.tagRepository.removeTagFromTodo(validated.todoId, validated.tagId);
  }
}

/**
 * Input for getting todos by tag
 */
export type GetTodosByTagInput = {
  tagId: string;
};

/**
 * Schema for getting todos by tag
 */
export const GetTodosByTagInputSchema = v.object({
  tagId: v.pipe(v.string(), v.uuid("Tag ID must be a valid UUID")),
});

/**
 * Use case for getting todos by tag
 */
export class GetTodosByTagUseCase {
  constructor(
    private tagRepository: TagRepository,
    private todoRepository: TodoRepository,
  ) {}

  /**
   * Execute the use case
   * @param input Input containing tag ID
   * @returns List of todos with the specified tag
   */
  async execute(input: GetTodosByTagInput): Promise<Todo[]> {
    // Validate input
    const validated = v.parse(GetTodosByTagInputSchema, input);

    // Check if tag exists
    const tag = await this.tagRepository.getTagById(validated.tagId);
    if (!tag) {
      throw new Error(`Tag with ID '${validated.tagId}' not found`);
    }

    // Get todo IDs for tag
    const todoIds = await this.tagRepository.getTodoIdsForTag(validated.tagId);

    // Get todos by IDs
    const todos: Todo[] = [];
    for (const todoId of todoIds) {
      const todo = await this.todoRepository.findById(todoId);
      if (todo) {
        todos.push(todo);
      }
    }

    return todos;
  }
}
