import { Task, type TaskStatus } from "../../../domain/models/Task";
import type { Task as TaskType } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

type UpdateTaskParams = {
  id: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
};

export class UpdateTaskUseCase {
  constructor(private taskRepository: TaskRepository) {}

  async execute(params: UpdateTaskParams): Promise<TaskType | null> {
    const { id, title, description, status } = params;

    // Find the task
    const task = await this.taskRepository.findById(id, true);
    if (!task) {
      return null;
    }

    // Apply updates
    let updatedTask = task;

    if (title !== undefined) {
      updatedTask = Task.updateTitle(updatedTask, title);
    }

    if (description !== undefined) {
      updatedTask = Task.updateDescription(updatedTask, description);
    }

    if (status !== undefined) {
      if (status === "completed") {
        updatedTask = Task.markAsCompleted(updatedTask);
      } else {
        updatedTask = Task.markAsIncomplete(updatedTask);
      }
    }

    // Save the updated task
    return this.taskRepository.save(updatedTask);
  }
}
