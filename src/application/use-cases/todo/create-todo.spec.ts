import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type Todo, TodoStatus, WorkState } from "../../../domain/entities/todo";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { CreateTodoUseCase } from "./create-todo";

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

describe("CreateTodoUseCase", () => {
  const mockTodoRepository = {
    findAll: mock<() => Promise<Todo[]>>(() => Promise.resolve([])),
    findById: mock<(id: string) => Promise<Todo | null>>(() => Promise.resolve(null)),
    create: mock<(todo: Omit<Todo, "id" | "createdAt" | "updatedAt">) => Promise<Todo>>(() =>
      Promise.resolve({} as Todo),
    ),
    update: mock<(id: string, todo: Partial<Todo>) => Promise<Todo | null>>(() => Promise.resolve(null)),
    delete: mock<(id: string) => Promise<void>>(() => Promise.resolve()),
  } as MockedTodoRepository;

  let useCase: CreateTodoUseCase;

  beforeEach(() => {
    useCase = new CreateTodoUseCase(mockTodoRepository);
    // Clear mock calls between tests
    mockTodoRepository.create.mockClear();
  });

  test("should create a todo with default values when only title is provided", async () => {
    // Arrange
    const todoData = {
      title: "New Test Todo",
    };

    const now = new Date();
    const createdTodo: Todo = {
      id: "new-todo-id",
      title: "New Test Todo",
      description: undefined,
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
    };

    mockTodoRepository.create.mockImplementationOnce(async () => Promise.resolve(createdTodo));

    // Act
    const result = await useCase.execute(todoData);

    // Assert
    expect(mockTodoRepository.create).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.create).toHaveBeenCalledWith({
      title: "New Test Todo",
      description: undefined,
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: expect.any(Date),
    });
    expect(result).toEqual(createdTodo);
  });

  test("should create a todo with provided values", async () => {
    // Arrange
    const todoData = {
      title: "New Test Todo",
      description: "This is a test todo with description",
    };

    const now = new Date();
    const createdTodo: Todo = {
      id: "new-todo-id",
      title: "New Test Todo",
      description: "This is a test todo with description",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: now,
      createdAt: now,
      updatedAt: now,
    };

    mockTodoRepository.create.mockImplementationOnce(async () => Promise.resolve(createdTodo));

    // Act
    const result = await useCase.execute(todoData);

    // Assert
    expect(mockTodoRepository.create).toHaveBeenCalledTimes(1);
    expect(mockTodoRepository.create).toHaveBeenCalledWith({
      title: "New Test Todo",
      description: "This is a test todo with description",
      status: TodoStatus.PENDING,
      workState: WorkState.IDLE,
      totalWorkTime: 0,
      lastStateChangeAt: expect.any(Date),
    });
    expect(result).toEqual(createdTodo);
  });
});
