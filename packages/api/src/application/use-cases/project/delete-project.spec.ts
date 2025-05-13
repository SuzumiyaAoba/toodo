import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import { DeleteProject } from "./delete-project";

describe("DeleteProject", () => {
  let mockProjectRepository: ProjectRepository;

  beforeEach(() => {
    mockProjectRepository = {
      create: mock(async (project: Project) => project),
      findById: mock(async () => null),
      findByName: mock(async () => null),
      findAll: mock(async () => []),
      update: mock(async (project: Project) => project),
      delete: mock(async () => {}),
      findTodosByProjectId: mock(async () => []),
      addTodo: mock(async () => {}),
      removeTodo: mock(async () => {}),
    };
  });

  it("should delete a project", async () => {
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project");
    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.delete = mock(async () => {});

    const useCase = new DeleteProject(mockProjectRepository);
    await useCase.execute(projectId);

    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.delete).toHaveBeenCalledWith(projectId);
  });

  it("should throw an error if project is not found", async () => {
    const projectId = "non-existent-id";
    mockProjectRepository.findById = mock(async () => null);

    const useCase = new DeleteProject(mockProjectRepository);

    await expect(useCase.execute(projectId)).rejects.toThrow(ProjectNotFoundError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.delete).not.toHaveBeenCalled();
  });
});
