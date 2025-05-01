import { type Mock, beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { Todo } from "../../../domain/entities/todo";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetTodosByProject } from "./get-todos-by-project";

describe("GetTodosByProject", () => {
  let mockProjectRepository: ProjectRepository;
  let mockTodoRepository: TodoRepository;

  // インターフェース定義を追加
  type MockedTodoRepository = {
    [K in keyof TodoRepository]: Mock<any>;
  };

  type MockedProjectRepository = {
    [K in keyof ProjectRepository]: Mock<any>;
  };

  beforeEach(() => {
    // ProjectRepositoryのモック
    mockProjectRepository = {
      create: mock(() => Promise.resolve({ id: "project-1", name: "Test Project" } as Project)),
      findById: mock(() => Promise.resolve({ id: "project-1", name: "Test Project" } as Project)),
      findByName: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({ id: "project-1", name: "Updated Project" } as Project)),
      delete: mock(() => Promise.resolve()),
      findTodosByProjectId: mock(() => Promise.resolve([])),
      addTodo: mock(() => Promise.resolve()),
      removeTodo: mock(() => Promise.resolve()),
      getTodosByProject: mock(() => Promise.resolve([])),
    } as MockedProjectRepository;

    // TodoRepositoryのモック
    mockTodoRepository = {
      create: mock(() => Promise.resolve({ id: "todo-1" } as Todo)),
      update: mock(() => Promise.resolve({ id: "todo-1" } as Todo)),
      findById: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
      findByProjectId: mock(() => Promise.resolve([])),
      findByTagId: mock(() => Promise.resolve([])),
      findDependencies: mock(() => Promise.resolve([])),
      findDependents: mock(() => Promise.resolve([])),
      addDependency: mock(() => Promise.resolve()),
      removeDependency: mock(() => Promise.resolve()),
      wouldCreateDependencyCycle: mock(() => Promise.resolve(false)),
      findAllCompleted: mock(() => Promise.resolve([])),
      // 期限日関連のメソッドを追加
      findOverdue: mock(() => Promise.resolve([])),
      findDueSoon: mock(() => Promise.resolve([])),
      findByDueDateRange: mock(() => Promise.resolve([])),
    } as MockedTodoRepository;
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

    const projectTodos = [todo1, todo2];

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findByProjectId = mock(async () => projectTodos);

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
    expect(mockTodoRepository.findByProjectId).toHaveBeenCalledWith(projectId);
  });

  it("should return an empty array if no todos belong to the project", async () => {
    // Arrange
    const projectId = "project-1";
    const existingProject = new Project(projectId, "Test Project");

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findByProjectId = mock(async () => []);

    const useCase = new GetTodosByProject(mockProjectRepository, mockTodoRepository);

    // Act
    const result = await useCase.execute(projectId);

    // Assert
    expect(result.project).toBe(existingProject);
    expect(result.todos).toHaveLength(0);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findByProjectId).toHaveBeenCalledWith(projectId);
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
