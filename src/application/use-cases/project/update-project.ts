import type { Project, ProjectId, ProjectStatus } from "../../../domain/entities/project";
import { ProjectNameExistsError, ProjectNotFoundError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";

export interface UpdateProjectInput {
  id: ProjectId;
  name?: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
}

export class UpdateProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: UpdateProjectInput): Promise<Project> {
    // Find the project by ID
    const project = await this.projectRepository.findById(input.id);
    if (!project) {
      throw new ProjectNotFoundError(input.id);
    }

    // If name is being updated, check if it already exists
    if (input.name && input.name !== project.name) {
      const existingProject = await this.projectRepository.findByName(input.name);
      if (existingProject && existingProject.id !== input.id) {
        throw new ProjectNameExistsError(input.name);
      }
    }

    // Update the project
    let updatedProject = project;

    if (input.name) {
      updatedProject = updatedProject.updateName(input.name);
    }

    if (input.description !== undefined) {
      updatedProject = updatedProject.updateDescription(input.description);
    }

    if (input.color !== undefined) {
      updatedProject = updatedProject.updateColor(input.color);
    }

    if (input.status) {
      updatedProject = updatedProject.updateStatus(input.status);
    }

    // Save the updated project
    return this.projectRepository.update(updatedProject);
  }
}
