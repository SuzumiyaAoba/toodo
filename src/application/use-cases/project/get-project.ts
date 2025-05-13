import type { Project, ProjectId } from "../../../domain/entities/project";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";

export class GetProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(id: ProjectId): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new ProjectNotFoundError(id);
    }
    return project;
  }
}
