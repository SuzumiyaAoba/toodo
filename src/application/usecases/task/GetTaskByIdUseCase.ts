import type { Task } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

export class GetTaskByIdUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id, true);
  }
}
