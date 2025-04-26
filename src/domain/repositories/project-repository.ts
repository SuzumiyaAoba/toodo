import type { Project, ProjectId } from "../entities/project";

export interface ProjectRepository {
  create(project: Project): Promise<Project>;
  findById(id: ProjectId): Promise<Project | null>;
  findByName(name: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  update(project: Project): Promise<Project>;
  delete(id: ProjectId): Promise<void>;
  findTodosByProjectId(id: ProjectId): Promise<string[]>;
}
