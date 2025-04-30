import type { Todo } from "@toodo/core";
import type { TodoRepository } from "../../../../domain/repositories/todo-repository";

export class GetOverdueTodosUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(): Promise<Todo[]> {
    const now = new Date();
    return this.todoRepository.findOverdue(now);
  }
}
