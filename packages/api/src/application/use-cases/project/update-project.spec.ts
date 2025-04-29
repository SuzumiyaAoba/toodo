import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { ProjectNameExistsError, ProjectNotFoundError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import { UpdateProject } from "./update-project";
import type { UpdateProjectInput } from "./update-project";

describe("UpdateProject", () => {
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
      getTodosByProject: mock(async () => []),
    };
  });

  it("should update a project's name", async () => {
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Original Project", "active", "Original Description", "#FF5733");
    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.findByName = mock(async () => null);
    mockProjectRepository.update = mock(async (project) => project);

    const useCase = new UpdateProject(mockProjectRepository);
    const input: UpdateProjectInput = {
      id: projectId,
      name: "Updated Project",
    };

    const updatedProject = await useCase.execute(input);

    expect(updatedProject.id).toBe(projectId);
    expect(updatedProject.name).toBe("Updated Project");
    expect(updatedProject.description).toBe("Original Description");
    expect(updatedProject.color).toBe("#FF5733");
    expect(updatedProject.status).toBe("active");
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.findByName).toHaveBeenCalledWith("Updated Project");
    expect(mockProjectRepository.update).toHaveBeenCalledTimes(1);
  });

  it("should update a project's description", async () => {
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project", "active", "Original Description", "#FF5733");
    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.update = mock(async (project) => project);

    const useCase = new UpdateProject(mockProjectRepository);
    const input: UpdateProjectInput = {
      id: projectId,
      description: "Updated Description",
    };

    const updatedProject = await useCase.execute(input);

    expect(updatedProject.description).toBe("Updated Description");
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.update).toHaveBeenCalledTimes(1);
  });

  it("should update a project's color", async () => {
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project", "active", "Test Description", "#FF5733");
    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.update = mock(async (project) => project);

    const useCase = new UpdateProject(mockProjectRepository);
    const input: UpdateProjectInput = {
      id: projectId,
      color: "#33FF57",
    };

    const updatedProject = await useCase.execute(input);

    expect(updatedProject.color).toBe("#33FF57");
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.update).toHaveBeenCalledTimes(1);
  });

  it("should update a project's status", async () => {
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project", "active", "Test Description", "#FF5733");
    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.update = mock(async (project) => project);

    const useCase = new UpdateProject(mockProjectRepository);
    const input: UpdateProjectInput = {
      id: projectId,
      status: "archived",
    };

    const updatedProject = await useCase.execute(input);

    expect(updatedProject.status).toBe("archived");
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.update).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if project is not found", async () => {
    const projectId = "non-existent-id";
    mockProjectRepository.findById = mock(async () => null);

    const useCase = new UpdateProject(mockProjectRepository);
    const input: UpdateProjectInput = {
      id: projectId,
      name: "Updated Project",
    };

    await expect(useCase.execute(input)).rejects.toThrow(ProjectNotFoundError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.update).not.toHaveBeenCalled();
  });

  it("should throw an error if new name already exists for another project", async () => {
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Original Project", "active");
    const conflictingProject = new Project("project-2", "Updated Project", "active");

    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.findByName = mock(async () => conflictingProject);

    const useCase = new UpdateProject(mockProjectRepository);
    const input: UpdateProjectInput = {
      id: projectId,
      name: "Updated Project",
    };

    await expect(useCase.execute(input)).rejects.toThrow(ProjectNameExistsError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.findByName).toHaveBeenCalledWith("Updated Project");
    expect(mockProjectRepository.update).not.toHaveBeenCalled();
  });

  it("should not check for duplicate name if name isn't being updated", async () => {
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project", "active");

    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.update = mock(async (project) => project);

    const useCase = new UpdateProject(mockProjectRepository);
    const input: UpdateProjectInput = {
      id: projectId,
      description: "Updated Description",
    };

    await useCase.execute(input);

    expect(mockProjectRepository.findByName).not.toHaveBeenCalled();
    expect(mockProjectRepository.update).toHaveBeenCalledTimes(1);
  });

  it("should allow updating to the same name", async () => {
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project", "active");

    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.update = mock(async (project) => project);

    const useCase = new UpdateProject(mockProjectRepository);
    const input: UpdateProjectInput = {
      id: projectId,
      name: "Test Project", // Same name as existing
    };

    await useCase.execute(input);

    expect(mockProjectRepository.findByName).not.toHaveBeenCalled();
    expect(mockProjectRepository.update).toHaveBeenCalledTimes(1);
  });
});
