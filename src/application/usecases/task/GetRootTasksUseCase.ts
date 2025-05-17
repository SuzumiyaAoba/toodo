import type { Task } from "../../../domain/models/Task";
import type { PaginationParams, TaskRepository } from "../../../domain/repositories/TaskRepository";

export class GetRootTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(params?: PaginationParams): Promise<Task[]> {
    if (params) {
      return this.taskRepository.findRootTasksWithPagination(params);
    }
    return this.taskRepository.findRootTasks();
  }
}
