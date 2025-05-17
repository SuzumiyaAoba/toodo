import type { Task } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

type MoveTaskParams = {
  taskId: string;
  newParentId: string | null;
};

export class MoveTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(params: MoveTaskParams): Promise<Task | null> {
    const { taskId, newParentId } = params;

    // Move task using repository
    return await this.taskRepository.moveTask(taskId, newParentId);
  }
}
