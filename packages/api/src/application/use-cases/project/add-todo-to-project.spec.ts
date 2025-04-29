import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import {
  ProjectNotFoundError,
  TodoAlreadyInProjectError,
  TodoNotFoundError,
} from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import type { MockedFunction } from "../../../test/types";
import { AddTodoToProjectUseCase } from "./add-todo-to-project";

describe("AddTodoToProjectUseCase", () => {
  let mockProjectRepository: ProjectRepository;
  let mockTodoRepository: TodoRepository;
  let useCase: AddTodoToProjectUseCase;

  function createMockTodo(id: string, title: string): Todo {
    return new Todo(
      id,
      title,
      TodoStatus.PENDING,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      PriorityLevel.MEDIUM,
    );
  }

  beforeEach(() => {
    mockProjectRepository = {
      findById: mock(() => Promise.resolve(null)),
      findAll: mock(() => Promise.resolve([])),
      create: mock((project: Project) => Promise.resolve(project)),
      update: mock((project: Project) => Promise.resolve(project)),
      delete: mock((id: string) => Promise.resolve()),
      addTodo: mock((projectId: string, todoId: string) => Promise.resolve()),
      removeTodo: mock((projectId: string, todoId: string) => Promise.resolve()),
      findTodosByProjectId: mock((projectId: string) => Promise.resolve([])),
      findByName: mock(() => Promise.resolve(null)),
      getTodosByProject: mock((projectId: string) => Promise.resolve([])),
    } as unknown as ProjectRepository;

    mockTodoRepository = {
      ...createMockedTodoRepository(),
      findById: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve(null)),
    } as unknown as TodoRepository;

    useCase = new AddTodoToProjectUseCase(mockProjectRepository, mockTodoRepository);
  });

  it("should add a todo to a project", async () => {
    // Arrange
    const projectId = "project-1";
    const todoId = "todo-1";
    const existingProject = new Project(projectId, "Test Project");
    const existingTodo = createMockTodo(todoId, "Test Todo");
    const updatedTodo = existingTodo.assignToProject(projectId);

    mockProjectRepository.findById = mock(async () => existingProject);
    mockTodoRepository.findById = mock(async () => existingTodo);
    mockTodoRepository.update = mock(async () => updatedTodo);

    const input = {
      projectId,
      todoId,
    };

    // Act
    await useCase.execute(input);

    // Assert
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.update).toHaveBeenCalledTimes(1);

    // mock.calls を使用せずに検証する
    expect(mockTodoRepository.update).toHaveBeenCalled();
  });

  it("should throw an error if project is not found", async () => {
    // Arrange
    const projectId = "non-existent-project";
    const todoId = "todo-1";

    mockProjectRepository.findById = mock(async () => null);

    const input = {
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

    const input = {
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
