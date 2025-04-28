import type { TodoId } from "../../../domain/entities/todo";
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
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @param todoId ID of the todo that depends on another
   * @param dependencyId ID of the todo that is depended on
   */
  async execute(todoId: TodoId, dependencyId: TodoId): Promise<void> {
    // 自分自身への依存は許可しない
    if (todoId === dependencyId) {
      throw new SelfDependencyError(todoId);
    }

    // 両方のTodoが存在するか確認
    const todo = await this.todoRepository.findById(todoId);
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    const dependency = await this.todoRepository.findById(dependencyId);
    if (!dependency) {
      throw new TodoNotFoundError(dependencyId);
    }

    // 既存の依存関係があるか確認
    if (todo.hasDependencyOn(dependencyId)) {
      throw new DependencyExistsError(todoId, dependencyId);
    }

    // 循環依存が発生しないか確認
    const wouldCreateCycle = await this.todoRepository.wouldCreateDependencyCycle(todoId, dependencyId);
    if (wouldCreateCycle) {
      throw new DependencyCycleError(todoId, dependencyId);
    }

    // 依存関係を追加
    await this.todoRepository.addDependency(todoId, dependencyId);
  }
}
