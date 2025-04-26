import type { ProjectId } from "../../../domain/entities/project";
import type { TodoId } from "../../../domain/entities/todo";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

export interface AddTodoToProjectInput {
  projectId: ProjectId;
  todoId: TodoId;
}

export class AddTodoToProject {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly todoRepository: TodoRepository,
  ) {}

  async execute(input: AddTodoToProjectInput): Promise<void> {
    // Check if the project exists
    const project = await this.projectRepository.findById(input.projectId);
    if (!project) {
      throw new ProjectNotFoundError(input.projectId);
    }

    // Check if the todo exists
    const todo = await this.todoRepository.findById(input.todoId);
    if (!todo) {
      throw new TodoNotFoundError(input.todoId);
    }

    // Add the todo to the project
    const updatedTodo = todo.assignToProject(input.projectId);
    await this.todoRepository.update(updatedTodo.id, updatedTodo);
  }
}
