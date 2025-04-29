import { ActivityType } from "@toodo/core";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * DeleteTodoUseCase handles deleting an existing todo
 */
export class DeleteTodoUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private todoActivityRepository: TodoActivityRepository,
  ) {}

  /**
   * Execute the use case
   * @param id Todo id
   */
  async execute(id: string): Promise<void> {
    // Create a "discarded" activity before deleting the todo
    await this.todoActivityRepository.create({
      todoId: id,
      type: ActivityType.DISCARDED,
      note: "TODO was deleted from the system",
    });

    // Delete the todo
    await this.todoRepository.delete(id);
  }
}
