import type { Todo, TodoId } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * GetTodoDependentsUseCase handles retrieving todos that depend on a specified todo
 */
export class GetTodoDependentsUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @param todoId ID of the todo to get dependents for
   * @returns List of todos that depend on the specified todo
   */
  async execute(todoId: TodoId): Promise<Todo[]> {
    // Todoが存在するか確認
    const todo = await this.todoRepository.findById(todoId);
    if (!todo) {
      throw new TodoNotFoundError(todoId);
    }

    // このTodoに依存しているTodoを取得
    return this.todoRepository.findDependents(todoId);
  }
}
