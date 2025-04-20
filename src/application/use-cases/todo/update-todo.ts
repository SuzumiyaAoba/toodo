import type { Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * UpdateTodoUseCase handles updating an existing todo
 */
export class UpdateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @param id Todo id
   * @param data Todo update data
   * @returns Updated todo
   * @throws TodoNotFoundError if todo not found
   */
  async execute(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: TodoStatus;
      workState?: WorkState;
    },
  ): Promise<Todo> {
    const updatedTodo = await this.todoRepository.update(id, {
      title: data.title,
      description: data.description,
      status: data.status,
      workState: data.workState,
    });

    if (!updatedTodo) {
      throw new TodoNotFoundError(id);
    }

    return updatedTodo;
  }
}
