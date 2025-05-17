import type { Subtask, SubtaskStatus } from "../../../domain/models/Subtask";
import type { SubtaskRepository } from "../../../domain/repositories/SubtaskRepository";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export type UpdateSubtaskCmd = {
  id: string;
  title?: string;
  description?: string | null;
  status?: SubtaskStatus;
};

export class UpdateSubtaskUseCase {
  constructor(
    private subtaskRepository: SubtaskRepository,
    private todoRepository: TodoRepository,
  ) {}

  async execute(dto: UpdateSubtaskCmd): Promise<Subtask | null> {
    let subtask = await this.subtaskRepository.findById(dto.id);

    if (!subtask) {
      return null;
    }

    if (dto.title !== undefined) {
      subtask = subtask.updateTitle(dto.title);
    }

    if (dto.description !== undefined) {
      subtask = subtask.updateDescription(dto.description);
    }

    if (dto.status !== undefined) {
      subtask = subtask.updateStatus(dto.status);
    }

    const updatedSubtask = await this.subtaskRepository.save(subtask);

    if (dto.status !== undefined) {
      const todo = await this.todoRepository.findById(subtask.todoId);
      if (todo) {
        const updatedTodo = todo.updateCompletionStatus();
        await this.todoRepository.save(updatedTodo);
      }
    }

    return updatedSubtask;
  }
}
