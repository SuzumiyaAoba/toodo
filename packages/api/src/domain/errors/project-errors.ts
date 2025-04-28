export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project with ID ${projectId} not found`);
    this.name = "ProjectNotFoundError";
  }
}

export class ProjectNameExistsError extends Error {
  constructor(name: string) {
    super(`Project with name ${name} already exists`);
    this.name = "ProjectNameExistsError";
  }
}

export class TodoNotInProjectError extends Error {
  constructor(todoId: string, projectId: string) {
    super(`Todo ${todoId} does not belong to project ${projectId}`);
    this.name = "TodoNotInProjectError";
  }
}

export class TodoAlreadyInProjectError extends Error {
  constructor(todoId: string, projectId: string) {
    super(`Todo ${todoId} is already in project ${projectId}`);
    this.name = "TodoAlreadyInProjectError";
  }
}

// Re-export TodoNotFoundError from todo-errors for convenience
export { TodoNotFoundError } from "./todo-errors";
