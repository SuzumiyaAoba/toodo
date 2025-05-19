import { inject, injectable, singleton } from "tsyringe";
import type { Task } from "../../../domain/models/Task";
import {
  CircularReferenceError,
  ParentTaskNotFoundError,
  SelfReferenceError,
  TaskNotFoundError,
} from "../../../domain/models/errors";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";
import { TOKENS } from "../../services/DependencyTokens";

type MoveTaskParams = {
  taskId: string;
  newParentId: string | null;
};

@injectable()
@singleton()
export class MoveTaskUseCase {
  constructor(@inject(TOKENS.TaskRepository) private taskRepository: TaskRepository) {}

  async execute(params: MoveTaskParams): Promise<Task | null> {
    const { taskId, newParentId } = params;

    // Validate that task exists
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new TaskNotFoundError(taskId);
    }

    // Check for self-reference
    if (newParentId === taskId) {
      throw new SelfReferenceError(taskId);
    }

    // Validate parent exists if newParentId is provided
    if (newParentId) {
      const parent = await this.taskRepository.findById(newParentId);
      if (!parent) {
        throw new ParentTaskNotFoundError(newParentId);
      }

      // Check for circular reference
      const isCircular = await this.checkForCircularReference(newParentId, taskId);
      if (isCircular) {
        throw new CircularReferenceError(
          `Cannot move task ${taskId} to parent ${newParentId} as it would create a circular reference`,
        );
      }
    }

    // Move task using repository
    return await this.taskRepository.moveTask(taskId, newParentId);
  }

  private async checkForCircularReference(parentId: string, taskId: string): Promise<boolean> {
    // Check if parentId is a descendant of taskId
    const parent = await this.taskRepository.findById(parentId, false);

    if (!parent) {
      return false;
    }

    if (parent.parentId === taskId) {
      return true;
    }

    if (parent.parentId) {
      return this.checkForCircularReference(parent.parentId, taskId);
    }

    return false;
  }
}
