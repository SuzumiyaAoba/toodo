import type { SubtaskRepository } from "../../../domain/repositories/SubtaskRepository";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export class DeleteSubtaskUseCase {
  constructor(
    private subtaskRepository: SubtaskRepository,
    private todoRepository: TodoRepository,
  ) {}

  async execute(id: string): Promise<boolean> {
    const subtask = await this.subtaskRepository.findById(id);

    if (!subtask) {
      return false;
    }

    const todoId = subtask.todoId;
    await this.subtaskRepository.delete(id);

    const todo = await this.todoRepository.findById(todoId);
    if (todo) {
      todo.updateCompletionStatus();
      await this.todoRepository.save(todo);
    }

    return true;
  }
}
