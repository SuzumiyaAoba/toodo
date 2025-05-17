import type { Task } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

export class GetRootTasksUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(): Promise<Task[]> {
    return this.taskRepository.findRootTasks();
  }
}
