import { Todo } from "../../../domain/models/Todo";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export type CreateTodoCmd = {
  content: string;
};

export class CreateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(dto: CreateTodoCmd): Promise<Todo> {
    const todo = new Todo(dto.content);
    return this.todoRepository.save(todo);
  }
}
