import type { Todo } from "../../../../domain/entities/todo";
import type { TodoRepository } from "../../../../domain/repositories/todo-repository";

/**
 * FindDueSoonTodosUseCase handles retrieving todos that are due soon and not completed
 */
export class FindDueSoonTodosUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case to find todos due soon
   * @param days Number of days to consider "soon" (default: 2)
   * @param currentDate Optional date to compare against (defaults to now)
   * @returns Array of todos due soon
   */
  async execute(days = 2, currentDate?: Date): Promise<Todo[]> {
    return this.todoRepository.findDueSoon(days, currentDate);
  }
}
