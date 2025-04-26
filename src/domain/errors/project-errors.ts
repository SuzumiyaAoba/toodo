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
