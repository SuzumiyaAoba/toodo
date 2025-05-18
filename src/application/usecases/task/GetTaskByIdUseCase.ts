import { inject, injectable, singleton } from "tsyringe";
import type { Task } from "../../../domain/models/Task";
import type { TaskRepository } from "../../../domain/repositories/TaskRepository";
import { TOKENS } from "../../services/DependencyTokens";

@injectable()
@singleton()
export class GetTaskByIdUseCase {
  constructor(
    @inject(TOKENS.TaskRepository) private taskRepository: TaskRepository
  ) {}

  async execute(id: string): Promise<Task | null> {
    return this.taskRepository.findById(id, true);
  }
}
