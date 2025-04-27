import type { Todo, TodoId } from "../../../../domain/entities/todo";
import type { TodoRepository } from "../../../../domain/repositories/todo-repository";

/**
 * BulkUpdateDueDateUseCase handles updating the due dates of multiple todos at once
 */
export class BulkUpdateDueDateUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case to update the due dates of multiple todos
   * @param todoIds Array of todo IDs to update
   * @param dueDate New due date to set for all todos, or undefined to remove the due date
   * @returns Updated todos
   */
  async execute(todoIds: TodoId[], dueDate?: Date): Promise<Todo[]> {
    const updatedTodos: Todo[] = [];

    // Retrieve each todo, update its due date, and save it
    for (const todoId of todoIds) {
      const todo = await this.todoRepository.findById(todoId);
      if (todo) {
        const updatedTodo = todo.updateDueDate(dueDate);
        const savedTodo = await this.todoRepository.update(todoId, updatedTodo);
        if (savedTodo) {
          updatedTodos.push(savedTodo);
        }
      }
    }

    return updatedTodos;
  }
}
