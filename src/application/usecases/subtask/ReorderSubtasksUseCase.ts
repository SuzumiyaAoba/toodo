import { Subtask } from "../../../domain/models/Subtask";
import { SubtaskRepository } from "../../../domain/repositories/SubtaskRepository";
import { TodoRepository } from "../../../domain/repositories/TodoRepository";

export interface ReorderSubtasksDTO {
  todoId: string;
  orderMap: Record<string, number>;
}

export class ReorderSubtasksUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private subtaskRepository: SubtaskRepository
  ) {}

  async execute(dto: ReorderSubtasksDTO): Promise<Subtask[] | null> {
    const todo = await this.todoRepository.findById(dto.todoId);

    if (!todo) {
      return null;
    }

    todo.reorderSubtasks(dto.orderMap);
    await this.todoRepository.save(todo);

    return todo.subtasks;
  }
}
