import type { Todo } from "../../../domain/entities/todo";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * GetTodoListUseCase handles retrieving the list of todos
 */
export class GetTodoListUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @returns List of todos
   */
  async execute(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }
}
