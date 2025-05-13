import { describe, expect, it } from "bun:test";
import { Project, ProjectStatus } from "./project";

describe("Project", () => {
  const projectId = "project-1";
  const projectName = "Test Project";
  const projectDescription = "Test Description";
  const projectColor = "#FF5733";
  const projectStatus: ProjectStatus = "active";
  const createdAt = new Date("2025-04-01T00:00:00.000Z");
  const updatedAt = new Date("2025-04-01T00:00:00.000Z");

  it("should create a project with default values", () => {
    const project = new Project(projectId, projectName);

    expect(project.id).toBe(projectId);
    expect(project.name).toBe(projectName);
    expect(project.status).toBe("active");
    expect(project.description).toBeUndefined();
    expect(project.color).toBeUndefined();
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.updatedAt).toBeInstanceOf(Date);
  });

  it("should create a project with all values", () => {
    const project = new Project(
      projectId,
      projectName,
      projectStatus,
      projectDescription,
      projectColor,
      createdAt,
      updatedAt,
    );

    expect(project.id).toBe(projectId);
    expect(project.name).toBe(projectName);
    expect(project.status).toBe(projectStatus);
    expect(project.description).toBe(projectDescription);
    expect(project.color).toBe(projectColor);
    expect(project.createdAt).toBe(createdAt);
    expect(project.updatedAt).toBe(updatedAt);
  });

  it("should create a project using static create method", () => {
    const project = Project.create(
      projectId,
      projectName,
      projectStatus,
      projectDescription,
      projectColor,
      createdAt,
      updatedAt,
    );

    expect(project.id).toBe(projectId);
    expect(project.name).toBe(projectName);
    expect(project.status).toBe(projectStatus);
    expect(project.description).toBe(projectDescription);
    expect(project.color).toBe(projectColor);
    expect(project.createdAt).toBe(createdAt);
    expect(project.updatedAt).toBe(updatedAt);
  });

  it("should update project name", () => {
    const project = new Project(
      projectId,
      projectName,
      projectStatus,
      projectDescription,
      projectColor,
      createdAt,
      updatedAt,
    );
    const newName = "Updated Project";
    const updatedProject = project.updateName(newName);

    expect(updatedProject.id).toBe(projectId);
    expect(updatedProject.name).toBe(newName);
    expect(updatedProject.status).toBe(projectStatus);
    expect(updatedProject.description).toBe(projectDescription);
    expect(updatedProject.color).toBe(projectColor);
    expect(updatedProject.createdAt).toBe(createdAt);
    expect(updatedProject.updatedAt).not.toBe(updatedAt);
  });

  it("should update project description", () => {
    const project = new Project(
      projectId,
      projectName,
      projectStatus,
      projectDescription,
      projectColor,
      createdAt,
      updatedAt,
    );
    const newDescription = "Updated Description";
    const updatedProject = project.updateDescription(newDescription);

    expect(updatedProject.id).toBe(projectId);
    expect(updatedProject.name).toBe(projectName);
    expect(updatedProject.status).toBe(projectStatus);
    expect(updatedProject.description).toBe(newDescription);
    expect(updatedProject.color).toBe(projectColor);
    expect(updatedProject.createdAt).toBe(createdAt);
    expect(updatedProject.updatedAt).not.toBe(updatedAt);
  });

  it("should update project color", () => {
    const project = new Project(
      projectId,
      projectName,
      projectStatus,
      projectDescription,
      projectColor,
      createdAt,
      updatedAt,
    );
    const newColor = "#33FF57";
    const updatedProject = project.updateColor(newColor);

    expect(updatedProject.id).toBe(projectId);
    expect(updatedProject.name).toBe(projectName);
    expect(updatedProject.status).toBe(projectStatus);
    expect(updatedProject.description).toBe(projectDescription);
    expect(updatedProject.color).toBe(newColor);
    expect(updatedProject.createdAt).toBe(createdAt);
    expect(updatedProject.updatedAt).not.toBe(updatedAt);
  });

  it("should update project status", () => {
    const project = new Project(
      projectId,
      projectName,
      "active",
      projectDescription,
      projectColor,
      createdAt,
      updatedAt,
    );
    const newStatus: ProjectStatus = "archived";
    const updatedProject = project.updateStatus(newStatus);

    expect(updatedProject.id).toBe(projectId);
    expect(updatedProject.name).toBe(projectName);
    expect(updatedProject.status).toBe(newStatus);
    expect(updatedProject.description).toBe(projectDescription);
    expect(updatedProject.color).toBe(projectColor);
    expect(updatedProject.createdAt).toBe(createdAt);
    expect(updatedProject.updatedAt).not.toBe(updatedAt);
  });

  it("should archive a project", () => {
    const project = new Project(
      projectId,
      projectName,
      "active",
      projectDescription,
      projectColor,
      createdAt,
      updatedAt,
    );
    const archivedProject = project.archive();

    expect(archivedProject.status).toBe("archived");
  });

  it("should activate a project", () => {
    const project = new Project(
      projectId,
      projectName,
      "archived",
      projectDescription,
      projectColor,
      createdAt,
      updatedAt,
    );
    const activatedProject = project.activate();

    expect(activatedProject.status).toBe("active");
  });
});
