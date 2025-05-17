import { inject, injectable, singleton } from "tsyringe";
import type { Task } from "../../../domain/models/Task";
import { ParentTaskNotFoundError, TaskNotFoundError } from "../../../domain/models/errors";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

type MoveTaskParams = {
  taskId: string;
  newParentId: string | null;
};

@injectable()
@singleton()
export class MoveTaskUseCase {
  constructor(@inject("TaskRepository") private taskRepository: TaskRepository) {}

  async execute(params: MoveTaskParams): Promise<Task | null> {
    const { taskId, newParentId } = params;

    // Validate that task exists
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new TaskNotFoundError(taskId);
    }

    // Validate parent exists if newParentId is provided
    if (newParentId) {
      const parent = await this.taskRepository.findById(newParentId);
      if (!parent) {
        throw new ParentTaskNotFoundError(newParentId);
      }
    }

    // Move task using repository
    return await this.taskRepository.moveTask(taskId, newParentId);
  }
}
