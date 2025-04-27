import type { Todo } from "../../../../domain/entities/todo";
import type { TodoRepository } from "../../../../domain/repositories/todo-repository";

/**
 * FindOverdueTodosUseCase handles retrieving todos that are past their due date and not completed
 */
export class FindOverdueTodosUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case to find overdue todos
   * @param currentDate Optional date to compare against (defaults to now)
   * @returns Array of overdue todos
   */
  async execute(currentDate?: Date): Promise<Todo[]> {
    return this.todoRepository.findOverdue(currentDate);
  }
}
