import type { Subtask } from "../../../domain/models/Subtask";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export interface AddSubtaskDTO {
  todoId: string;
  title: string;
  description?: string | null;
}

export class AddSubtaskUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(dto: AddSubtaskDTO): Promise<Subtask | null> {
    const todo = await this.todoRepository.findById(dto.todoId);

    if (!todo) {
      return null;
    }

    const subtask = todo.addSubtask(dto.title, dto.description);
    await this.todoRepository.save(todo);

    return subtask;
  }
}
