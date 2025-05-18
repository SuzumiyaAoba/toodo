import { inject, injectable, singleton } from "tsyringe";
import type { Task } from "../../../domain/models/Task";
import type { PaginationParams, TaskRepository } from "../../../domain/repositories/TaskRepository";
import { TOKENS } from "../../services/DependencyTokens";

@injectable()
@singleton()
export class GetRootTasksUseCase {
  constructor(
    @inject(TOKENS.TaskRepository)
    private readonly taskRepository: TaskRepository,
  ) {}

  async execute(params?: PaginationParams): Promise<readonly Task[]> {
    if (params) {
      return this.taskRepository.findRootTasksWithPagination(params);
    }
    return this.taskRepository.findRootTasks();
  }
}
