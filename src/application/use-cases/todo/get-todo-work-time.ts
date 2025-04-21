import { WorkState } from "../../../domain/entities/todo";
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

    // Calculate the current total work time, including ongoing work if in ACTIVE state
    let totalWorkTime = todo.totalWorkTime;
    if (todo.workState === WorkState.ACTIVE && todo.lastStateChangeAt) {
      const now = new Date();
      const activeTime = Math.floor((now.getTime() - todo.lastStateChangeAt.getTime()) / 1000);
      totalWorkTime += activeTime;
    }

    // Format the work time
    const formattedTime = this.formatWorkTime(totalWorkTime);

    return {
      id: todo.id,
      totalWorkTime: totalWorkTime,
      workState: todo.workState,
      formattedTime,
    };
  }

  /**
   * Format work time in seconds to a human-readable string
   * @param seconds Total seconds
   * @returns Formatted time string in shortened format (e.g., "2h 30m 15s")
   */
  private formatWorkTime(seconds: number): string {
    if (seconds === 0) {
      return "0s";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours}h`);
      // 時間がある場合は常に分を表示（0分でも表示）
      parts.push(`${minutes}m`);
    } else {
      // 時間がない場合
      if (minutes > 0) {
        parts.push(`${minutes}m`);
      }

      if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) {
        parts.push(`${remainingSeconds}s`);
      }
    }

    return parts.join(" ");
  }
}
