import type { Subtask } from "../../../domain/models/Subtask";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export type AddSubtaskCmd = {
  todoId: string;
  title: string;
  description?: string | null;
};

export class AddSubtaskUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(dto: AddSubtaskCmd): Promise<Subtask | null> {
    const todo = await this.todoRepository.findById(dto.todoId);

    if (!todo) {
      return null;
    }

    const updatedTodo = todo.addSubtask(dto.title, dto.description);
    const savedTodo = await this.todoRepository.save(updatedTodo);

    // 最後に追加された subtask を返す
    if (savedTodo.subtasks.length > 0) {
      const lastSubtask = savedTodo.subtasks[savedTodo.subtasks.length - 1];
      return lastSubtask || null;
    }

    return null;
  }
}
