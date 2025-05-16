import { Todo } from "../../../domain/models/Todo";
import { TodoRepository } from "../../../domain/repositories/TodoRepository";

export interface CreateTodoDTO {
  content: string;
}

export class CreateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(dto: CreateTodoDTO): Promise<Todo> {
    const todo = new Todo(dto.content);
    return this.todoRepository.save(todo);
  }
}
