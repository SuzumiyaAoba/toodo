import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { ProjectNameExistsError } from "../../../domain/errors/project-errors";
import { ProjectRepository } from "../../../domain/repositories/project-repository";
import { CreateProject, CreateProjectInput } from "./create-project";

describe("CreateProject", () => {
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

  it("should create a new project", async () => {
    mockProjectRepository.findByName = mock(async () => null);

    const projectData: CreateProjectInput = {
      name: "Test Project",
      description: "This is a test project",
      color: "#FF5733",
    };

    const useCase = new CreateProject(mockProjectRepository);
    const createdProject = await useCase.execute(projectData);

    expect(createdProject.name).toBe(projectData.name);
    // toEqualではなく、型を考慮した条件チェックに変更
    if (projectData.description) {
      expect(createdProject.description).toBe(projectData.description);
    }
    if (projectData.color) {
      expect(createdProject.color).toBe(projectData.color);
    }
    expect(createdProject.status).toBe("active");
    expect(mockProjectRepository.findByName).toHaveBeenCalledWith(projectData.name);
    expect(mockProjectRepository.create).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if a project with the same name already exists", async () => {
    const existingProject = new Project("project-1", "Test Project");
    mockProjectRepository.findByName = mock(async () => existingProject);
    mockProjectRepository.create = mock(async (project: Project) => project);

    const input: CreateProjectInput = {
      name: "Test Project",
    };

    const useCase = new CreateProject(mockProjectRepository);
    await expect(useCase.execute(input)).rejects.toThrow(ProjectNameExistsError);
    expect(mockProjectRepository.findByName).toHaveBeenCalledWith(input.name);
    expect(mockProjectRepository.create).not.toHaveBeenCalled();
  });

  it("should create a project with specified status", async () => {
    mockProjectRepository.findByName = mock(async () => null);

    const projectData: CreateProjectInput = {
      name: "Test Project",
      status: "archived",
    };

    const useCase = new CreateProject(mockProjectRepository);
    const createdProject = await useCase.execute(projectData);

    expect(createdProject.name).toBe(projectData.name);
    expect(createdProject.status).toBe("archived");
    expect(mockProjectRepository.findByName).toHaveBeenCalledWith(projectData.name);
    expect(mockProjectRepository.create).toHaveBeenCalledTimes(1);
  });
});
