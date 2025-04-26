import type { Project } from "../../../domain/entities/project";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";

export class GetAllProjects {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(): Promise<Project[]> {
    return this.projectRepository.findAll();
  }
}
