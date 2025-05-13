import { describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { ProjectRepository } from "../../../domain/repositories/project-repository";
import { GetAllProjects } from "./get-all-projects";

describe("GetAllProjects", () => {
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

  it("should get all projects", async () => {
    const expectedProjects = [
      new Project("project-1", "Project 1", "active"),
      new Project("project-2", "Project 2", "archived"),
    ];
    mockProjectRepository.findAll = mock(async () => expectedProjects);

    const useCase = new GetAllProjects(mockProjectRepository);
    const projects = await useCase.execute();

    expect(projects).toBe(expectedProjects);
    expect(mockProjectRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it("should return an empty array if no projects exist", async () => {
    mockProjectRepository.findAll = mock(async () => []);

    const useCase = new GetAllProjects(mockProjectRepository);
    const projects = await useCase.execute();

    expect(projects).toEqual([]);
    expect(mockProjectRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
