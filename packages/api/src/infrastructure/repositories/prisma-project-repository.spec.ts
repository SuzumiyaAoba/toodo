import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { v4 as uuidv4 } from "uuid";
import { Project } from "../../domain/entities/project";
import { PrismaProjectRepository } from "./prisma-project-repository";

describe("PrismaProjectRepository", () => {
  let repository: PrismaProjectRepository;
  let testProject: Project;

  beforeEach(async () => {
    repository = new PrismaProjectRepository();
    await repository.prisma.$connect();

    // Create a test project
    const projectId = uuidv4();
    testProject = new Project(projectId, "Test Project", "Test Description", "#FF5733", "active");
  });

  afterEach(async () => {
    // Clean up test data
    await repository.prisma.project.deleteMany({
      where: {
        name: {
          startsWith: "Test",
        },
      },
    });
    await repository.prisma.$disconnect();
  });

  it("should create a new project", async () => {
    const createdProject = await repository.create(testProject);
    expect(createdProject.id).toBe(testProject.id);
    expect(createdProject.name).toBe(testProject.name);
    // Changed to conditional checks considering the type instead of using toEqual
    if (testProject.description) {
      expect(createdProject.description).toBe(testProject.description);
    }
    if (testProject.color) {
      expect(createdProject.color).toBe(testProject.color);
    }
    expect(createdProject.status).toBe(testProject.status);
  });

  it("should find a project by id", async () => {
    await repository.create(testProject);
    const foundProject = await repository.findById(testProject.id);

    expect(foundProject).not.toBeNull();
    expect(foundProject?.id).toBe(testProject.id);
    expect(foundProject?.name).toBe(testProject.name);
  });

  it("should return null when finding a non-existent project by id", async () => {
    const foundProject = await repository.findById("non-existent-id");
    expect(foundProject).toBeNull();
  });

  it("should find a project by name", async () => {
    await repository.create(testProject);
    const foundProject = await repository.findByName(testProject.name);

    expect(foundProject).not.toBeNull();
    expect(foundProject?.id).toBe(testProject.id);
    expect(foundProject?.name).toBe(testProject.name);
  });

  it("should return null when finding a non-existent project by name", async () => {
    const foundProject = await repository.findByName("Non-existent Project");
    expect(foundProject).toBeNull();
  });

  it("should find all projects", async () => {
    await repository.create(testProject);

    const project2 = new Project(uuidv4(), "Test Project 2", "Test Description 2", "#33FF57", "archived");
    await repository.create(project2);

    const projects = await repository.findAll();

    expect(projects.length).toBeGreaterThanOrEqual(2);
    expect(projects.some((p) => p.id === testProject.id)).toBe(true);
    expect(projects.some((p) => p.id === project2.id)).toBe(true);
  });

  it("should update a project", async () => {
    await repository.create(testProject);

    const updatedProject = testProject.updateName("Updated Project Name");
    const result = await repository.update(updatedProject);

    expect(result.id).toBe(testProject.id);
    expect(result.name).toBe("Updated Project Name");

    const foundProject = await repository.findById(testProject.id);
    expect(foundProject?.name).toBe("Updated Project Name");
  });

  it("should delete a project", async () => {
    await repository.create(testProject);

    await repository.delete(testProject.id);

    const foundProject = await repository.findById(testProject.id);
    expect(foundProject).toBeNull();
  });

  it("should find todos by project id", async () => {
    await repository.create(testProject);

    // Create a test todo linked to the project
    await repository.prisma.todo.create({
      data: {
        id: uuidv4(),
        title: "Test Todo",
        projectId: testProject.id,
      },
    });

    const todoIds = await repository.findTodosByProjectId(testProject.id);
    expect(todoIds.length).toBe(1);
  });
});
