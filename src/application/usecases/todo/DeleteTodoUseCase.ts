import { TodoRepository } from "../../../domain/repositories/TodoRepository";

export class DeleteTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(id: string): Promise<boolean> {
    const todo = await this.todoRepository.findById(id);

    if (!todo) {
      return false;
    }

    await this.todoRepository.delete(id);
    return true;
  }
}
