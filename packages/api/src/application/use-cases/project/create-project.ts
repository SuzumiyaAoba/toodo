import { Project, type ProjectStatus } from "@toodo/core";
import { v4 as uuidv4 } from "uuid";
import { ProjectNameExistsError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  status?: ProjectStatus;
}

export class CreateProject {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    // Check if a project with the same name already exists
    const existingProject = await this.projectRepository.findByName(input.name);
    if (existingProject) {
      throw new ProjectNameExistsError(input.name);
    }

    // Create a new project with a generated ID
    const projectId = uuidv4();
    const project = Project.create(projectId, input.name, input.description, input.color, input.status);

    // Save the project
    return this.projectRepository.create(project);
  }
}
