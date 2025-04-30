import type { Todo } from "@toodo/core";
import type { TodoRepository } from "../../../../domain/repositories/todo-repository";

export class GetTodosDueSoonUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  async execute(days: number): Promise<Todo[]> {
    const currentDate = new Date();
    return this.todoRepository.findDueSoon(days, currentDate);
  }
}
