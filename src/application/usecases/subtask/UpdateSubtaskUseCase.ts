import type { Subtask } from "../../../domain/models/Subtask";
import type { SubtaskStatus } from "../../../domain/models/Subtask";
import type { SubtaskRepository } from "../../../domain/repositories/SubtaskRepository";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export interface UpdateSubtaskDTO {
  id: string;
  title?: string;
  description?: string | null;
  status?: SubtaskStatus;
}

export class UpdateSubtaskUseCase {
  constructor(
    private subtaskRepository: SubtaskRepository,
    private todoRepository: TodoRepository,
  ) {}

  async execute(dto: UpdateSubtaskDTO): Promise<Subtask | null> {
    const subtask = await this.subtaskRepository.findById(dto.id);

    if (!subtask) {
      return null;
    }

    if (dto.title !== undefined) {
      subtask.updateTitle(dto.title);
    }

    if (dto.description !== undefined) {
      subtask.updateDescription(dto.description);
    }

    if (dto.status !== undefined) {
      subtask.updateStatus(dto.status);
    }

    const updatedSubtask = await this.subtaskRepository.save(subtask);

    if (dto.status !== undefined) {
      const todo = await this.todoRepository.findById(subtask.todoId);
      if (todo) {
        todo.updateCompletionStatus();
        await this.todoRepository.save(todo);
      }
    }

    return updatedSubtask;
  }
}
