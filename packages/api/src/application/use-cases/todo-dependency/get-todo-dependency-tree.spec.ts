import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createMockedTodoRepository } from "../../../domain/entities/test-helpers";
import { PriorityLevel, Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import type { MockedFunction } from "../../../test/types";
import { GetTodoDependencyTreeUseCase } from "./get-todo-dependency-tree";

describe("GetTodoDependencyTreeUseCase", () => {
  let mockTodoRepository: TodoRepository;
  let useCase: GetTodoDependencyTreeUseCase;

  // ヘルパー関数
  function createMockTodo(
    id: string,
    title: string,
    status: TodoStatus,
    priority: PriorityLevel,
    description?: string,
  ): Todo {
    return new Todo(
      id,
      title,
      status,
      WorkState.IDLE,
      0,
      new Date(),
      new Date(),
      new Date(),
      priority,
      undefined,
      description,
    );
  }

  beforeEach(() => {
    mockTodoRepository = {
      ...createMockedTodoRepository(),
      findById: mock(() => Promise.resolve(null)),
      findDependencies: mock(() => Promise.resolve([])),
    };

    useCase = new GetTodoDependencyTreeUseCase(mockTodoRepository);
  });

  it("should throw TodoNotFoundError when todo is not found", async () => {
    await expect(useCase.execute("non-existent-id")).rejects.toThrow(TodoNotFoundError);
  });

  it("should return a tree structure of todo dependencies", async () => {
    // モックデータの作成
    const todo1 = createMockTodo("todo-1", "Root Todo", TodoStatus.IN_PROGRESS, PriorityLevel.MEDIUM, "Root task");
    const todo2 = createMockTodo("todo-2", "Dependency 1", TodoStatus.PENDING, PriorityLevel.LOW, "Dependency 1");
    const todo3 = createMockTodo("todo-3", "Dependency 2", TodoStatus.PENDING, PriorityLevel.HIGH, "Dependency 2");
    const todo4 = createMockTodo(
      "todo-4",
      "Sub-dependency",
      TodoStatus.COMPLETED,
      PriorityLevel.MEDIUM,
      "Sub-dependency",
    );

    // モックの設定
    const mockFindById = mockTodoRepository.findById as MockedFunction<typeof mockTodoRepository.findById>;
    mockFindById.mockImplementation((id: string) => {
      if (id === "todo-1") return Promise.resolve(todo1);
      if (id === "todo-2") return Promise.resolve(todo2);
      if (id === "todo-3") return Promise.resolve(todo3);
      if (id === "todo-4") return Promise.resolve(todo4);
      return Promise.resolve(null);
    });

    const mockFindDependencies = mockTodoRepository.findDependencies as MockedFunction<
      typeof mockTodoRepository.findDependencies
    >;
    mockFindDependencies.mockImplementation((id: string) => {
      if (id === "todo-1") return Promise.resolve([todo2, todo3]);
      if (id === "todo-2") return Promise.resolve([todo4]);
      if (id === "todo-3") return Promise.resolve([]);
      if (id === "todo-4") return Promise.resolve([]);
      return Promise.resolve([]);
    });

    const result = await useCase.execute("todo-1");

    // 期待される結果
    expect(result).toEqual({
      id: "todo-1",
      title: "Root Todo",
      status: TodoStatus.IN_PROGRESS,
      priority: PriorityLevel.MEDIUM,
      dependencies: [
        {
          id: "todo-2",
          title: "Dependency 1",
          status: TodoStatus.PENDING,
          priority: PriorityLevel.LOW,
          dependencies: [
            {
              id: "todo-4",
              title: "Sub-dependency",
              status: TodoStatus.COMPLETED,
              priority: PriorityLevel.MEDIUM,
              dependencies: [],
            },
          ],
        },
        {
          id: "todo-3",
          title: "Dependency 2",
          status: TodoStatus.PENDING,
          priority: PriorityLevel.HIGH,
          dependencies: [],
        },
      ],
    });

    // 適切な呼び出しが行われたことを確認
    expect(mockFindById).toHaveBeenCalledWith("todo-1");
    expect(mockFindDependencies).toHaveBeenCalledWith("todo-1");
    expect(mockFindDependencies).toHaveBeenCalledWith("todo-2");
    expect(mockFindDependencies).toHaveBeenCalledWith("todo-3");
  });

  it("should handle circular dependencies", async () => {
    // モックデータの作成
    const todo1 = createMockTodo("todo-1", "Root Todo", TodoStatus.IN_PROGRESS, PriorityLevel.MEDIUM, "Root task");
    const todo2 = createMockTodo(
      "todo-2",
      "Circular Dependency",
      TodoStatus.PENDING,
      PriorityLevel.LOW,
      "Circular Dependency",
    );

    // 循環依存をモック
    const mockFindById = mockTodoRepository.findById as MockedFunction<typeof mockTodoRepository.findById>;
    mockFindById.mockImplementation((id: string) => {
      if (id === "todo-1") return Promise.resolve(todo1);
      if (id === "todo-2") return Promise.resolve(todo2);
      return Promise.resolve(null);
    });

    const mockFindDependencies = mockTodoRepository.findDependencies as MockedFunction<
      typeof mockTodoRepository.findDependencies
    >;
    mockFindDependencies.mockImplementation((id: string) => {
      if (id === "todo-1") return Promise.resolve([todo2]);
      if (id === "todo-2") return Promise.resolve([todo1]); // 循環依存
      return Promise.resolve([]);
    });

    const result = await useCase.execute("todo-1");

    // 期待される結果 - 循環依存は処理されず、1レベル目までのみ展開される
    expect(result).toEqual({
      id: "todo-1",
      title: "Root Todo",
      status: TodoStatus.IN_PROGRESS,
      priority: PriorityLevel.MEDIUM,
      dependencies: [
        {
          id: "todo-2",
          title: "Circular Dependency",
          status: TodoStatus.PENDING,
          priority: PriorityLevel.LOW,
          dependencies: [], // 循環依存のため、todo-1は再度展開されない
        },
      ],
    });
  });

  it("should respect maxDepth parameter", async () => {
    // モックデータの作成
    const todo1 = createMockTodo("todo-1", "Root", TodoStatus.PENDING, PriorityLevel.LOW, "Root");
    const todo2 = createMockTodo("todo-2", "Level 1", TodoStatus.PENDING, PriorityLevel.MEDIUM, "Level 1");
    const todo3 = createMockTodo("todo-3", "Level 2", TodoStatus.PENDING, PriorityLevel.HIGH, "Level 2");

    // 依存関係をモック
    const mockFindById = mockTodoRepository.findById as MockedFunction<typeof mockTodoRepository.findById>;
    mockFindById.mockImplementation((id: string) => {
      if (id === "todo-1") return Promise.resolve(todo1);
      if (id === "todo-2") return Promise.resolve(todo2);
      if (id === "todo-3") return Promise.resolve(todo3);
      return Promise.resolve(null);
    });

    const mockFindDependencies = mockTodoRepository.findDependencies as MockedFunction<
      typeof mockTodoRepository.findDependencies
    >;
    mockFindDependencies.mockImplementation((id: string) => {
      if (id === "todo-1") return Promise.resolve([todo2]);
      if (id === "todo-2") return Promise.resolve([todo3]);
      return Promise.resolve([]);
    });

    const useCase = new GetTodoDependencyTreeUseCase(mockTodoRepository);

    // maxDepth=1 で実行（1階層目までしか展開しない）
    const result = await useCase.execute("todo-1", 1);

    // 期待される結果 - 1階層目までのみ展開される
    expect(result).toEqual({
      id: "todo-1",
      title: "Root",
      status: TodoStatus.PENDING,
      priority: PriorityLevel.LOW,
      dependencies: [
        {
          id: "todo-2",
          title: "Level 1",
          status: TodoStatus.PENDING,
          priority: PriorityLevel.MEDIUM,
          dependencies: [], // maxDepth=1のため、これ以上展開されない
        },
      ],
    });
  });
});
