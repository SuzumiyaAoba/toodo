import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Project } from "../../../domain/entities/project";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { ProjectNotFoundError, TodoNotFoundError, TodoNotInProjectError } from "../../../domain/errors/project-errors";
import type { ProjectRepository } from "../../../domain/repositories/project-repository";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import type { MockedFunction } from "../../../test/types";
import { RemoveTodoFromProjectUseCase } from "./remove-todo-from-project";

describe("RemoveTodoFromProjectUseCase", () => {
  let mockProjectRepository: ProjectRepository;
  let mockTodoRepository: TodoRepository;
  let useCase: RemoveTodoFromProjectUseCase;

  function createMockTodo(id: string, title: string, projectId?: string): Todo {
    const todo = new Todo(
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
    if (projectId) {
      return todo.assignToProject(projectId);
    }
    return todo;
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
    } as unknown as ProjectRepository;

    mockTodoRepository = {
      ...createMockedTodoRepository(),
      findById: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve(null)),
    } as unknown as TodoRepository;

    useCase = new RemoveTodoFromProjectUseCase(mockProjectRepository, mockTodoRepository);
  });

  it("should remove a todo from a project", async () => {
    // Arrange
    const projectId = "project-1";
    const todoId = "todo-1";
    const existingProject = new Project(projectId, "Test Project");
    const existingTodo = createMockTodo(todoId, "Test Todo", projectId);
    const updatedTodo = createMockTodo(todoId, "Test Todo");

    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.findTodosByProjectId = mock(async () => [todoId]);
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
    expect(mockProjectRepository.findTodosByProjectId).toHaveBeenCalledWith(projectId);
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
    expect(mockProjectRepository.findTodosByProjectId).not.toHaveBeenCalled();
    expect(mockTodoRepository.findById).not.toHaveBeenCalled();
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });

  it("should throw an error if todo is not found", async () => {
    // Arrange
    const projectId = "project-1";
    const todoId = "non-existent-todo";
    const existingProject = new Project(projectId, "Test Project");

    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.findTodosByProjectId = mock(async () => [todoId]);
    mockTodoRepository.findById = mock(async () => null);

    const input = {
      projectId,
      todoId,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(TodoNotFoundError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.findTodosByProjectId).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith(todoId);
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });

  it("should throw an error if todo is not in project", async () => {
    // Arrange
    const projectId = "project-1";
    const todoId = "todo-1";
    const existingProject = new Project(projectId, "Test Project");
    const existingTodo = createMockTodo(todoId, "Test Todo");

    mockProjectRepository.findById = mock(async () => existingProject);
    mockProjectRepository.findTodosByProjectId = mock(async () => []);
    mockTodoRepository.findById = mock(async () => existingTodo);

    const input = {
      projectId,
      todoId,
    };

    // Act & Assert
    await expect(useCase.execute(input)).rejects.toThrow(TodoNotInProjectError);
    expect(mockProjectRepository.findById).toHaveBeenCalledWith(projectId);
    expect(mockProjectRepository.findTodosByProjectId).toHaveBeenCalledWith(projectId);
    expect(mockTodoRepository.findById).not.toHaveBeenCalled();
    expect(mockTodoRepository.update).not.toHaveBeenCalled();
  });
});
