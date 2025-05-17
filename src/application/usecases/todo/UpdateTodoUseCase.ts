import type { Todo } from "../../../domain/models/Todo";
import { Todo as TodoNamespace } from "../../../domain/models/Todo";
import type { TodoRepository } from "../../../domain/repositories/TodoRepository";

export type UpdateTodoCmd = {
  id: string;
  content?: string;
  completed?: boolean;
};

export class UpdateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  async execute(dto: UpdateTodoCmd): Promise<Todo | null> {
    let todo = await this.todoRepository.findById(dto.id);

    if (!todo) {
      return null;
    }

    if (dto.content !== undefined) {
      todo = TodoNamespace.updateContent(todo, dto.content);
    }

    if (dto.completed !== undefined) {
      if (dto.completed) {
        todo = TodoNamespace.markAsCompleted(todo);
      } else {
        todo = TodoNamespace.markAsIncomplete(todo);
      }
    }

    return this.todoRepository.save(todo);
  }
}
