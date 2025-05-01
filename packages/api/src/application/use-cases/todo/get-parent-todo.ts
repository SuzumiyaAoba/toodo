import type { Todo } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

export class GetParentTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute({ subtaskId }: { subtaskId: string }): Promise<Todo | null> {
    const subtask = await this.todoRepository.findById(subtaskId);
    if (!subtask) throw new TodoNotFoundError(subtaskId);
    if (!subtask.parentId) return null;
    const parent = await this.todoRepository.findById(subtask.parentId);
    return parent ?? null;
  }
}
