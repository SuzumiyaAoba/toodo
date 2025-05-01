import {
  DependencyCycleError,
  DependencyExistsError,
  SelfDependencyError,
  TodoNotFoundError,
} from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * AddTodoDependencyUseCase handles the addition of a dependency relationship between two todos
 */
export class AddTodoDependencyUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @param todoId ID of the todo that depends on another
   * @param dependencyId ID of the todo that is depended on
   */
  async execute(todoId: string, dependencyId: string): Promise<void> {
    const todo = await this.todoRepository.findById(todoId);
    const dependency = await this.todoRepository.findById(dependencyId);

    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    if (!dependency) {
      throw new TodoNotFoundError(dependencyId);
    }

    if (todoId === dependencyId) {
      throw new SelfDependencyError(todoId);
    }

    const hasDependency = await this.todoRepository.hasDependency(todoId, dependencyId);

    if (hasDependency) {
      throw new DependencyExistsError(todoId, dependencyId);
    }

    const wouldCreateCycle = await this.todoRepository.wouldCreateDependencyCycle(todoId, dependencyId);

    if (wouldCreateCycle) {
      throw new DependencyCycleError(todoId, dependencyId);
    }

    await this.todoRepository.addDependency(todoId, dependencyId);
  }
}
