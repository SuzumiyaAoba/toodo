import * as v from "valibot";
import type { Todo } from "../../../domain/entities/todo";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * Input for getting todos by multiple tags
 */
export type GetTodosByMultipleTagsInput = {
  tagIds: string[];
  mode: "all" | "any";
};

/**
 * Schema for getting todos by multiple tags
 */
export const GetTodosByMultipleTagsInputSchema = v.object({
  tagIds: v.array(v.pipe(v.string(), v.uuid("Tag ID must be a valid UUID"))),
  mode: v.picklist(["all", "any"] as const, "Filter mode must be either 'all' or 'any'"),
});

/**
 * Use case for getting todos by multiple tags
 */
export class GetTodosByMultipleTagsUseCase {
  constructor(
    private tagRepository: TagRepository,
    private todoRepository: TodoRepository,
  ) {}

  /**
   * Execute the use case
   * @param input Input containing tag IDs and filter mode
   * @returns List of todos that match the filter criteria
   */
  async execute(input: GetTodosByMultipleTagsInput): Promise<Todo[]> {
    // Validate input
    const validated = v.parse(GetTodosByMultipleTagsInputSchema, input);

    if (validated.tagIds.length === 0) {
      return [];
    }

    // Verify that all tags exist
    for (const tagId of validated.tagIds) {
      const tag = await this.tagRepository.getTagById(tagId);
      if (!tag) {
        throw new Error(`Tag with ID '${tagId}' not found`);
      }
    }

    // Get todo IDs based on filter mode
    let todoIds: string[];
    if (validated.mode === "all") {
      // Get todos that have all the specified tags
      todoIds = await this.tagRepository.getTodoIdsWithAllTags(validated.tagIds);
    } else {
      // Get todos that have any of the specified tags
      todoIds = await this.tagRepository.getTodoIdsWithAnyTag(validated.tagIds);
    }

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
