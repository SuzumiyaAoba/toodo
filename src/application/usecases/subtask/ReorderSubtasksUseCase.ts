import type { Subtask } from "../../../domain/models/Subtask";
import { Todo as TodoNamespace } from "../../../domain/models/Todo";
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

    const updatedTodo = TodoNamespace.reorderSubtasks(todo, dto.orderMap);
    const savedTodo = await this.todoRepository.save(updatedTodo);

    return [...savedTodo.subtasks];
  }
}
