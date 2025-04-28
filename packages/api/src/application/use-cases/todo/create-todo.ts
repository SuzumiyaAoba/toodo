import { type PriorityLevel, Todo, type TodoStatus, type WorkState } from "@toodo/core";
import type { TodoActivityRepository } from "../../../domain/repositories/todo-activity-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * CreateTodoUseCase handles the creation of a new todo
 */
export class CreateTodoUseCase {
  constructor(
    private todoRepository: TodoRepository,
    private todoActivityRepository?: TodoActivityRepository,
  ) {}

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
    parentId?: string;
    dueDate?: Date;
    projectId?: string;
  }): Promise<Todo> {
    return this.todoRepository.create(
      Todo.createNew({
        id: Date.now().toString(),
        title: data.title,
        description: data.description,
        status: data.status,
        workState: data.workState,
        priority: data.priority,
        parentId: data.parentId,
        dueDate: data.dueDate,
        projectId: data.projectId,
      }),
    );
  }
}
