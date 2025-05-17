import { Task } from "../../../domain/models/Task";
import type { Task as TaskType } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

type CreateTaskParams = {
  title: string;
  description?: string | null;
  parentId?: string | null;
};

export class CreateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(params: CreateTaskParams): Promise<TaskType> {
    const { title, description = null, parentId = null } = params;

    // Create task with provided parameters
    const task = Task.create(title, parentId, description);

    // Save to repository
    return this.taskRepository.save(task);
  }
}
