import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { ProjectNotFoundError } from "../../../domain/errors/project-errors";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import { ProjectRepository } from "../../../domain/repositories/project-repository";
import { TodoRepository } from "../../../domain/repositories/todo-repository";
import { MockedFunction } from "../../../test/types";
import { AddTodoToProject, AddTodoToProjectInput } from "./add-todo-to-project";

// モック化されたリポジトリの型
interface MockedTodoRepository extends TodoRepository {
  create: MockedFunction<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>;
  update: MockedFunction<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>;
  findById: MockedFunction<(id: string) => Promise<Todo | null>>;
  findAll: MockedFunction<() => Promise<Todo[]>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
}

interface MockedProjectRepository extends ProjectRepository {
  create: MockedFunction<(project: Project) => Promise<Project>>;
  findById: MockedFunction<(id: string) => Promise<Project | null>>;
  findByName: MockedFunction<(name: string) => Promise<Project | null>>;
  findAll: MockedFunction<() => Promise<Project[]>>;
  update: MockedFunction<(project: Project) => Promise<Project>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
  findTodosByProjectId: MockedFunction<(projectId: string) => Promise<string[]>>;
}

describe("AddTodoToProject", () => {
  let mockProjectRepository: MockedProjectRepository;
  let mockTodoRepository: MockedTodoRepository;

  beforeEach(() => {
    mockProjectRepository = {
      create: mock(() => Promise.resolve({} as Project)),
      findById: mock(() => Promise.resolve(null)),
      findByName: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
      update: mock(() => Promise.resolve({} as Project)),
      delete: mock(() => Promise.resolve()),
      findTodosByProjectId: mock(() => Promise.resolve([])),
    } as MockedProjectRepository;

    mockTodoRepository = {
      create: mock(() => Promise.resolve({ id: "todo-1" } as Todo)),
      update: mock(() => Promise.resolve({} as Todo)),
      findById: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
      delete: mock(() => Promise.resolve()),
    } as MockedTodoRepository;
  });

  it("should add a todo to a project", async () => {
    // Arrange
    const projectId = "project-1";
    const todoId = "todo-1";
    const existingProject = new Project(projectId, "Test Project");
    const existingTodo = new Todo(todoId, "Test Todo");
    const updatedTodo = existingTodo.assignToProject(projectId);

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findById = mock(async () => existingTodo);
    mockTodoRepository.update = mock(async (id: string, todo: Partial<Todo>) => updatedTodo);

    const useCase = new AddTodoToProject(mockProjectRepository, mockTodoRepository);
    const input: AddTodoToProjectInput = {
      projectId,
      todoId,
    };

    // Act
    await useCase.execute(input);

    // Assert
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);

    const updateCalls = mockTodoRepository.update.mock.calls;
    expect(updateCalls.length).toBe(1);
    expect(updateCalls[0][0]).toBe(todoId);
    expect(updateCalls[0][1].projectId).toBe(projectId);
  });

  it("should throw an error if project is not found", async () => {
    // Arrange
    const projectId = "non-existent-project";
    const todoId = "todo-1";

    mockProjectRepository.findById = mock(async () => null);

    const useCase = new AddTodoToProject(mockProjectRepository, mockTodoRepository);
    const input: AddTodoToProjectInput = {
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

    const useCase = new AddTodoToProject(mockProjectRepository, mockTodoRepository);
    const input: AddTodoToProjectInput = {
      projectId,
      todoId,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(TodoNotFoundError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });
});
