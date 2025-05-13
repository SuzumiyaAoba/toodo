import { beforeEach, describe, expect, mock, test } from "bun:test";
import { PriorityLevel, type Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { GetTodoListUseCase } from "./get-todo-list";

// モック関数の型を拡張
type MockedFunction<T extends (...args: any[]) => any> = {
  [K in keyof ReturnType<typeof mock<T>>]: ReturnType<typeof mock<T>>[K];
} & T;

// モック化されたリポジトリの型
interface MockedTodoRepository extends TodoRepository {
  findAll: MockedFunction<() => Promise<Todo[]>>;
  findById: MockedFunction<(id: string) => Promise<Todo | null>>;
  create: MockedFunction<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>;
  update: MockedFunction<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>;
  delete: MockedFunction<(id: string) => Promise<void>>;
}

describe("GetTodoListUseCase", () => {
  const mockTodoRepository = {
    findAll: mock<() => Promise<Todo[]>>(() => Promise.resolve([])),
    findById: mock<(id: string) => Promise<Todo | null>>(() => Promise.resolve(null)),
    create: mock<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>(() =>
      Promise.resolve({} as Todo),
    ),
    update: mock<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>(() => Promise.resolve(null)),
    delete: mock<(id: string) => Promise<void>>(() => Promise.resolve()),
  } as MockedTodoRepository;

  let useCase: GetTodoListUseCase;

  beforeEach(() => {
    useCase = new GetTodoListUseCase(mockTodoRepository);
    // Clear mock calls between tests
    mockTodoRepository.findAll.mockClear();
  });

  test("should get all todos", async () => {
    // Arrange
    const now = new Date();
    const mockTodos: Todo[] = [
      {
        id: "todo-1",
        title: "Todo 1",
        description: "Description 1",
        status: TodoStatus.PENDING,
        workState: WorkState.IDLE,
        totalWorkTime: 0,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
        priority: PriorityLevel.MEDIUM,
      },
      {
        id: "todo-2",
        title: "Todo 2",
        description: undefined,
        status: TodoStatus.COMPLETED,
        workState: WorkState.COMPLETED,
        totalWorkTime: 120,
        lastStateChangeAt: now,
        createdAt: now,
        updatedAt: now,
        priority: PriorityLevel.LOW,
      },
    ];

    mockTodoRepository.findAll.mockImplementationOnce(async () => Promise.resolve(mockTodos));

    // Act
    const result = await useCase.execute();

    // Assert
    expect(mockTodoRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("todo-1");
    expect(result[1].id).toBe("todo-2");
  });

  test("should return empty array when no todos exist", async () => {
    // Arrange
    mockTodoRepository.findAll.mockImplementationOnce(async () => Promise.resolve([]));

    // Act
    const result = await useCase.execute();

    // Assert
    expect(mockTodoRepository.findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });
});
