import { Subtask } from "../../../domain/models/Subtask";
import { SubtaskRepository } from "../../../domain/repositories/SubtaskRepository";
import { TodoRepository } from "../../../domain/repositories/TodoRepository";

export interface AddSubtaskDTO {
  todoId: string;
  title: string;
  description?: string | null;
}

export class AddSubtaskUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private subtaskRepository: SubtaskRepository
  ) {}

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
