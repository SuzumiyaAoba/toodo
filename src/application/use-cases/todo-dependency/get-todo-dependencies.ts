import type { Todo, TodoId } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * GetTodoDependenciesUseCase handles retrieving todos that a specified todo depends on
 */
export class GetTodoDependenciesUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @param todoId ID of the todo to get dependencies for
   * @returns List of todos that the specified todo depends on
   */
  async execute(todoId: TodoId): Promise<Todo[]> {
    // Todoが存在するか確認
    const todo = await this.todoRepository.findById(todoId);
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    // 依存しているTodoを取得
    return this.todoRepository.findDependencies(todoId);
  }
}
