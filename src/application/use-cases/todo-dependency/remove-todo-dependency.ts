import type { TodoId } from "../../../domain/entities/todo";
import { DependencyNotFoundError, TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * RemoveTodoDependencyUseCase handles the removal of a dependency relationship between two todos
 */
export class RemoveTodoDependencyUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @param todoId ID of the todo that depends on another
   * @param dependencyId ID of the todo that is depended on
   */
  async execute(todoId: TodoId, dependencyId: TodoId): Promise<void> {
    // 両方のTodoが存在するか確認
    const todo = await this.todoRepository.findById(todoId);
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    const dependency = await this.todoRepository.findById(dependencyId);
    if (!dependency) {
      throw new TodoNotFoundError(dependencyId);
    }

    // 依存関係が存在するか確認
    if (!todo.hasDependencyOn(dependencyId)) {
      throw new DependencyNotFoundError(todoId, dependencyId);
    }

    // 依存関係を削除
    await this.todoRepository.removeDependency(todoId, dependencyId);
  }
}
