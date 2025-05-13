import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { Todo } from "../../../domain/entities/todo";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import { ProjectRepository } from "../../../domain/repositories/project-repository";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import { MockedFunction } from "../../../test/types";
import { RemoveTodoFromProject, RemoveTodoFromProjectInput } from "./remove-todo-from-project";

// モック化されたリポジトリの型
interface MockedTodoRepository extends TodoRepository {
  create: MockedFunction<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>;
  update: MockedFunction<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>;
  findById: MockedFunction<(id: string) => Promise<Todo | null>>;
  findAll: MockedFunction<() => Promise<Todo[]>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
  findByProjectId: MockedFunction<(projectId: string) => Promise<Todo[]>>;
  findByTagId: MockedFunction<(tagId: string) => Promise<Todo[]>>;
  findDependencies: MockedFunction<(todoId: string) => Promise<Todo[]>>;
  findDependents: MockedFunction<(todoId: string) => Promise<Todo[]>>;
  addDependency: MockedFunction<(todoId: string, dependencyId: string) => Promise<void>>;
  removeDependency: MockedFunction<(todoId: string, dependencyId: string) => Promise<void>>;
  wouldCreateDependencyCycle: MockedFunction<(todoId: string, dependencyId: string) => Promise<boolean>>;
  findAllCompleted: MockedFunction<() => Promise<Todo[]>>;
  // 期限日関連のメソッドを追加
  findOverdue: MockedFunction<() => Promise<Todo[]>>;
  findDueSoon: MockedFunction<() => Promise<Todo[]>>;
  findByDueDateRange: MockedFunction<(start: Date, end: Date) => Promise<Todo[]>>;
}

interface MockedProjectRepository extends ProjectRepository {
  create: MockedFunction<(project: Project) => Promise<Project>>;
  findById: MockedFunction<(id: string) => Promise<Project | null>>;
  findByName: MockedFunction<(name: string) => Promise<Project | null>>;
  findAll: MockedFunction<() => Promise<Project[]>>;
  update: MockedFunction<(project: Project) => Promise<Project>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
}

describe("RemoveTodoFromProject", () => {
  let mockProjectRepository: MockedProjectRepository;
  let mockTodoRepository: MockedTodoRepository;
  let useCase: RemoveTodoFromProject;

  beforeEach(() => {
    mockProjectRepository = {
      create: mock(() => Promise.resolve({ id: "project-1", name: "Test Project" } as Project)),
      findById: mock(() => Promise.resolve({ id: "project-1", name: "Test Project" } as Project)),
      findByName: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({ id: "project-1", name: "Updated Project" } as Project)),
      delete: mock(() => Promise.resolve()),
      findTodosByProjectId: mock(() => Promise.resolve([])),
    } as MockedProjectRepository;

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

    useCase = new RemoveTodoFromProject(mockProjectRepository, mockTodoRepository);
  });

  it("should remove a todo from a project", async () => {
    // Arrange
    const projectId = "project-1";
    const todoId = "todo-1";
    const existingProject = new Project(projectId, "Test Project");

    // Create a todo with a projectId
    const existingTodo = new Todo(
      todoId,
      "Test Todo",
      undefined,
      undefined,
      0,
      undefined,
      undefined,
      undefined,
      undefined,
      projectId,
    );

    const updatedTodo = existingTodo.removeFromProject();

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findById = mock(async () => existingTodo);
    mockTodoRepository.update = mock(async (id: string, todo: Partial<Todo>) => updatedTodo);

    const input: RemoveTodoFromProjectInput = {
      projectId,
      todoId,
    };

    // Act
    await useCase.execute(input);

    // Assert
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);

    // 直接 update 関数に渡された引数を確認する
    const updateCalls = mockTodoRepository.update.mock.calls;
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0][0]).toBe(todoId);
    expect(updateCalls[0][1].projectId).toBeUndefined();
  });

  it("should throw an error if project is not found", async () => {
    // Arrange
    const projectId = "non-existent-project";
    const todoId = "todo-1";

    mockProjectRepository.findById = mock(async () => null);

    const input: RemoveTodoFromProjectInput = {
      projectId,
      todoId,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(ProjectNotFoundError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).not.toHaveBeenCalled();
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });

  it("should throw an error if todo is not found", async () => {
    // Arrange
    const projectId = "project-1";
    const todoId = "non-existent-todo";
    const existingProject = new Project(projectId, "Test Project");

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findById = mock(async () => null);

    const input: RemoveTodoFromProjectInput = {
      projectId,
      todoId,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(TodoNotFoundError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });

  it("should throw an error if todo does not belong to the project", async () => {
    // Arrange
    const projectId = "project-1";
    const todoId = "todo-1";
    const differentProjectId = "project-2";
    const existingProject = new Project(projectId, "Test Project");

    // Create a todo with a different projectId
    const existingTodo = new Todo(
      todoId,
      "Test Todo",
      undefined,
      undefined,
      0,
      undefined,
      undefined,
      undefined,
      undefined,
      differentProjectId,
    );

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findById = mock(async () => existingTodo);

    const input: RemoveTodoFromProjectInput = {
      projectId,
      todoId,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(`Todo ${todoId} does not belong to project ${projectId}`);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });
});
