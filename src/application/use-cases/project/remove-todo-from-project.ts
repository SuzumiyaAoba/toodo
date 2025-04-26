import type { ProjectId } from "../../../domain/entities/project";
import type { TodoId } from "../../../domain/entities/todo";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

export interface RemoveTodoFromProjectInput {
  projectId: ProjectId;
  todoId: TodoId;
}

export class RemoveTodoFromProject {
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

    // Check if the todo exists
    const todo = await this.todoRepository.findById(input.todoId);
    if (!todo) {
      throw new TodoNotFoundError(input.todoId);
    }

    // Check if todo belongs to the project
    if (todo.projectId !== input.projectId) {
      throw new Error(`Todo ${input.todoId} does not belong to project ${input.projectId}`);
    }

    // Remove the todo from the project
    const updatedTodo = todo.removeFromProject();
    await this.todoRepository.update(updatedTodo.id, updatedTodo);
  }
}
