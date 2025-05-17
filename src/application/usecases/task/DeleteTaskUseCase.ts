import { inject, injectable, singleton } from "tsyringe";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";

@injectable()
@singleton()
export class DeleteTaskUseCase {
  constructor(@inject("TaskRepository") private taskRepository: TaskRepository) {}

  async execute(id: string): Promise<boolean> {
    const task = await this.taskRepository.findById(id, false);

    if (!task) {
      return false;
    }

    await this.taskRepository.delete(id);
    return true;
  }
}
