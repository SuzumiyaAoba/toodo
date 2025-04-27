import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { Todo } from "../../../domain/entities/todo";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import { ProjectRepository } from "../../../domain/repositories/project-repository";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetTodosByProject } from "./get-todos-by-project";

describe("GetTodosByProject", () => {
  let mockProjectRepository: ProjectRepository;
  let mockTodoRepository: TodoRepository;

  beforeEach(() => {
    mockProjectRepository = {
      create: mock(async (project: Project) => project),
      findById: mock(async () => null),
      findByName: mock(async () => null),
      findAll: mock(async () => []),
      update: mock(async (project: Project) => project),
      delete: mock(async () => {}),
      findTodosByProjectId: mock(async () => []),
    };

    mockTodoRepository = {
      create: mock(async () => ({ id: "todo-1" }) as Todo),
      update: mock(async (id: string, todo: Partial<Todo>) => todo as Todo),
      findById: mock(async () => null),
      findAll: mock(async () => []),
      delete: mock(async () => {}),
      addDependency: mock(async () => {}),
      removeDependency: mock(async () => {}),
      findDependents: mock(async () => []),
      findDependencies: mock(async () => []),
      wouldCreateDependencyCycle: mock(async () => false),
      findAllCompleted: mock(async () => []),
    };
  });

  it("should get all todos in a project", async () => {
    // Arrange
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project");

    // Create todos, some with the target projectId, some without
    const todo1 = new Todo(
      "todo-1",
      "Todo 1",
      undefined,
      undefined,
      0,
      undefined,
      undefined,
      undefined,
      undefined,
      projectId,
    );
    const todo2 = new Todo(
      "todo-2",
      "Todo 2",
      undefined,
      undefined,
      0,
      undefined,
      undefined,
      undefined,
      undefined,
      projectId,
    );
    const todo3 = new Todo("todo-3", "Todo 3"); // No project
    const todo4 = new Todo(
      "todo-4",
      "Todo 4",
      undefined,
      undefined,
      0,
      undefined,
      undefined,
      undefined,
      undefined,
      "project-2",
    ); // Different project

    const allTodos = [todo1, todo2, todo3, todo4];

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findAll = mock(async () => allTodos);

    const useCase = new GetTodosByProject(mockProjectRepository, mockTodoRepository);

    // Act
    const result = await useCase.execute(projectId);

    // Assert
    expect(result.project).toBe(existingProject);
    expect(result.todos).toHaveLength(2);
    expect(result.todos).toContain(todo1);
    expect(result.todos).toContain(todo2);
    expect(result.todos).not.toContain(todo3);
    expect(result.todos).not.toContain(todo4);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it("should return an empty array if no todos belong to the project", async () => {
    // Arrange
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project");

    // Create todos with no matching projectId
    const todo1 = new Todo("todo-1", "Todo 1");
    const todo2 = new Todo(
      "todo-2",
      "Todo 2",
      undefined,
      undefined,
      0,
      undefined,
      undefined,
      undefined,
      undefined,
      "project-2",
    );

    const allTodos = [todo1, todo2];

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findAll = mock(async () => allTodos);

    const useCase = new GetTodosByProject(mockProjectRepository, mockTodoRepository);

    // Act
    const result = await useCase.execute(projectId);

    // Assert
    expect(result.project).toBe(existingProject);
    expect(result.todos).toHaveLength(0);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it("should throw an error if project is not found", async () => {
    // Arrange
    const projectId = "non-existent-project";

    mockProjectRepository.findById = mock(async () => null);

    const useCase = new GetTodosByProject(mockProjectRepository, mockTodoRepository);

    // Act & Assert
    await expect(useCase.execute(projectId)).rejects.toThrow(ProjectNotFoundError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findAll).not.toHaveBeenCalled();
  });
});
