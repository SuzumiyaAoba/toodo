import type { Todo } from "../../../../domain/entities/todo";
import type { TodoRepository } from "../../../../domain/repositories/todo-repository";

/**
 * FindByDueDateRangeUseCase handles retrieving todos with due dates within a specified range
 */
export class FindByDueDateRangeUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case to find todos with due dates in the specified range
   * @param startDate Start date of the range (inclusive)
   * @param endDate End date of the range (inclusive)
   * @returns Array of todos with due dates in the range
   */
  async execute(startDate: Date, endDate: Date): Promise<Todo[]> {
    return this.todoRepository.findByDueDateRange(startDate, endDate);
  }
}
