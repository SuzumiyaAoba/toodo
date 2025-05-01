import type { Project, ProjectId } from "../../../domain/entities/project";
import type { Todo } from "../../../domain/entities/todo";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

export class GetTodosByProject {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly todoRepository: TodoRepository,
  ) {}

  async execute(projectId: ProjectId): Promise<{ project: Project; todos: Todo[] }> {
    // Check if the project exists
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new ProjectNotFoundError(projectId);
    }

    // Find all todos that belong to the project
    const todos = await this.todoRepository.findByProjectId(projectId);

    return {
      project,
      todos,
    };
  }
}
