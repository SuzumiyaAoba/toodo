import { type PriorityLevel, Todo, type TodoStatus, type WorkState } from "../../../domain/entities/todo";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * CreateTodoUseCase handles the creation of a new todo
 */
export class CreateTodoUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * Execute the use case
   * @param data Todo creation data
   * @returns Created todo
   */
  async execute(data: {
    title: string;
    description?: string;
    status?: TodoStatus;
    workState?: WorkState;
    priority?: PriorityLevel;
  }): Promise<Todo> {
    return this.todoRepository.create(
      Todo.createNew({
        title: data.title,
        description: data.description,
        status: data.status,
        workState: data.workState,
        priority: data.priority,
      }),
    );
  }
}
