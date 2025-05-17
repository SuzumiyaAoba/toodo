import type { Subtask } from "../../../domain/models/Subtask";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export type ReorderSubtasksCmd = {
  todoId: string;
  orderMap: Record<string, number>;
};

export class ReorderSubtasksUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(dto: ReorderSubtasksCmd): Promise<Subtask[] | null> {
    const todo = await this.todoRepository.findById(dto.todoId);

    if (!todo) {
      return null;
    }

    todo.reorderSubtasks(dto.orderMap);
    await this.todoRepository.save(todo);

    return todo.subtasks;
  }
}
