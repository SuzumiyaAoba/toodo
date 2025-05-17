import { inject, injectable, singleton } from "tsyringe";
import type { Task } from "../../../domain/models/Task";
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

    // Move task using repository
    return await this.taskRepository.moveTask(taskId, newParentId);
  }
}
