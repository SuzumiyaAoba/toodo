import type { TodoActivity } from "@toodo/core/domain/entities/todo-activity";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * GetTodoActivityListUseCase handles retrieving activities for a specific todo
 */
export class GetTodoActivityListUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private todoActivityRepository: TodoActivityRepository,
  ) {}

  /**
   * Execute the use case
   * @param todoId Todo id
   * @returns List of activities for the todo
   */
  async execute(todoId: string): Promise<TodoActivity[]> {
    // Verify that the todo exists
    const todo = await this.todoRepository.findById(todoId);
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    // Get the activity history
    return this.todoActivityRepository.findByTodoId(todoId);
  }
}
