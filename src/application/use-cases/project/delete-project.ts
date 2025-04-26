import type { ProjectId } from "../../../domain/entities/project";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";

export class DeleteProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(id: ProjectId): Promise<void> {
    // Check if the project exists
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new ProjectNotFoundError(id);
    }

    // Delete the project
    await this.projectRepository.delete(id);
  }
}
