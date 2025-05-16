import type { Todo } from "../../../domain/models/Todo";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export class GetAllTodosUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }
}
