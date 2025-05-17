import { inject, injectable, singleton } from "tsyringe";
import { Task } from "../../../domain/models/Task";
import type { Task as TaskType } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

type CreateTaskParams = {
  title: string;
  description?: string | null;
  parentId?: string | null;
};

@injectable()
@singleton()
export class CreateTaskUseCase {
  constructor(@inject("TaskRepository") private taskRepository: TaskRepository) {}

  async execute(params: CreateTaskParams): Promise<TaskType> {
    const { title, description = null, parentId = null } = params;

    // Validate parent exists if parentId is provided
    if (parentId) {
      const parent = await this.taskRepository.findById(parentId);
      if (!parent) {
        throw new Error(`Parent task ${parentId} not found`);
      }
    }

    // Create task with provided parameters
    const task = Task.create(title, parentId, description);

    // Save to repository
    return this.taskRepository.save(task);
  }
}
