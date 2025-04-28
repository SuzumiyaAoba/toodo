import { describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import { GetProject } from "./get-project";

describe("GetProject", () => {
  const mockProjectRepository: ProjectRepository = {
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

  it("should get a project by id", async () => {
    const projectId = "project-1";
    const expectedProject = new Project(projectId, "Test Project", "active", "Test Description", "#FF5733");
    mockProjectRepository.findById = mock(async () => expectedProject);

    const useCase = new GetProject(mockProjectRepository);
    const project = await useCase.execute(projectId);

    expect(project).toBe(expectedProject);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
  });

  it("should throw an error if project is not found", async () => {
    const projectId = "non-existent-id";
    mockProjectRepository.findById = mock(async () => null);

    const useCase = new GetProject(mockProjectRepository);

    await expect(useCase.execute(projectId)).rejects.toThrow(ProjectNotFoundError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
  });
});
