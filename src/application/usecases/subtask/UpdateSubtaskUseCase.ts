import type { Subtask, SubtaskStatus } from "../../../domain/models/Subtask";
import { Subtask as SubtaskNamespace } from "../../../domain/models/Subtask";
import { Todo as TodoNamespace } from "../../../domain/models/Todo";
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
      subtask = SubtaskNamespace.updateTitle(subtask, dto.title);
    }

    if (dto.description !== undefined) {
      subtask = SubtaskNamespace.updateDescription(subtask, dto.description);
    }

    if (dto.status !== undefined) {
      subtask = SubtaskNamespace.updateStatus(subtask, dto.status);
    }

    const updatedSubtask = await this.subtaskRepository.save(subtask);

    if (dto.status !== undefined) {
      const todo = await this.todoRepository.findById(subtask.todoId);
      if (todo) {
        const updatedTodo = TodoNamespace.updateCompletionStatus(todo);
        await this.todoRepository.save(updatedTodo);
      }
    }

    return updatedSubtask;
  }
}
