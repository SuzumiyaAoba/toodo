import type { Tag, Todo } from "@toodo/core";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TagRepository } from "../../../domain/repositories/tag-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * GetTodoUseCase handles retrieving a specific todo by id
 */
export class GetTodoUseCase {
  constructor(
    private readonly todoRepository: TodoRepository,
    private readonly tagRepository: TagRepository,
  ) {}

  /**
   * Execute the use case
   * @param id Todo id
   * @returns Todo with associated tags
   * @throws TodoNotFoundError if todo not found
   */
  async execute(id: string): Promise<{ todo: Todo; tags: Tag[] }> {
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new TodoNotFoundError(id);
    }

    const tags = await this.tagRepository.getTagsForTodo(id);

    return {
      todo,
      tags,
    };
  }
}
