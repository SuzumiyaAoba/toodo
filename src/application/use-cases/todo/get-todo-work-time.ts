import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * GetTodoWorkTimeUseCase handles retrieving work time information for a todo
 */
export class GetTodoWorkTimeUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @param id Todo id
   * @returns Work time information
   */
  async execute(id: string): Promise<{
    id: string;
    totalWorkTime: number;
    workState: string;
    formattedTime: string;
  }> {
    // Check if the todo exists
    const todo = await this.todoRepository.findById(id);
    if (!todo) {
      throw new TodoNotFoundError(id);
    }

    // Format the work time
    const formattedTime = this.formatWorkTime(todo.totalWorkTime);

    return {
      id: todo.id,
      totalWorkTime: todo.totalWorkTime,
      workState: todo.workState,
      formattedTime,
    };
  }

  /**
   * Format work time in seconds to a human-readable string
   * @param seconds Total seconds
   * @returns Formatted time string (e.g., "2 hours, 30 minutes, 15 seconds")
   */
  private formatWorkTime(seconds: number): string {
    if (seconds === 0) {
      return "0 seconds";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];

    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? "hour" : "hours"}`);
    }

    if (minutes > 0) {
      parts.push(`${minutes} ${minutes === 1 ? "minute" : "minutes"}`);
    }

    if (remainingSeconds > 0) {
      parts.push(`${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}`);
    }

    return parts.join(", ");
  }
}
