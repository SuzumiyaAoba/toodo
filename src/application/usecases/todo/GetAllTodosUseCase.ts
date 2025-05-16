import { Todo } from "../../../domain/models/Todo";
import { TodoRepository } from "../../../domain/repositories/TodoRepository";

export class GetAllTodosUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }
}
