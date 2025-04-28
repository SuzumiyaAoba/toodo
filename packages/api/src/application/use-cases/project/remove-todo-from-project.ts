import type { ProjectId } from "../../../domain/entities/project";
import type { TodoId } from "../../../domain/entities/todo";
import { ProjectNotFoundError, TodoNotInProjectError } from "../../../domain/errors/project-errors";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

export interface RemoveTodoFromProjectInput {
  projectId: ProjectId;
  todoId: TodoId;
}

export class RemoveTodoFromProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly todoRepository: TodoRepository,
  ) {}

  async execute(input: RemoveTodoFromProjectInput): Promise<void> {
    // Check if the project exists
    const project = await this.projectRepository.findById(input.projectId);
    if (!project) {
      throw new ProjectNotFoundError(input.projectId);
    }

    // Get project todos and check if the todo is part of the project
    const projectTodoIds = await this.projectRepository.findTodosByProjectId(input.projectId);
    if (!projectTodoIds.includes(input.todoId)) {
      throw new TodoNotInProjectError(input.todoId, input.projectId);
    }

    // Check if the todo exists
    const todo = await this.todoRepository.findById(input.todoId);
    if (!todo) {
      throw new TodoNotFoundError(input.todoId);
    }

    // Remove the todo from the project
    await this.projectRepository.removeTodo(input.projectId, input.todoId);
  }
}

// 別名エクスポートを追加して互換性を保持
export const RemoveTodoFromProject = RemoveTodoFromProjectUseCase;
