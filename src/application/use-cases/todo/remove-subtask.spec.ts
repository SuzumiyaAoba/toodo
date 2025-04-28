import { describe, expect, it, mock } from "bun:test";
import { Todo } from "../../../domain/entities/todo";
import { SubtaskNotFoundError, TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";
import { RemoveSubtaskUseCase } from "./remove-subtask";

describe("RemoveSubtaskUseCase", () => {
  const mockTodoRepository = {
    findById: mock(),
    removeSubtask: mock(),
  } as unknown as TodoRepository;

  const useCase = new RemoveSubtaskUseCase(mockTodoRepository);

  it("should remove a subtask successfully", async () => {
    // サブタスクを持つ親タスクをモック
    const parentTodo = {
      id: "parent-id",
      hasSubtask: mock().mockReturnValue(true),
    } as unknown as Todo;

    // サブタスクをモック
    const subtaskTodo = {
      id: "subtask-id",
    } as unknown as Todo;

    // findByIdの振る舞いをセットアップ
    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(parentTodo));
    findByIdMock.mockReturnValueOnce(Promise.resolve(subtaskTodo));
    mockTodoRepository.findById = findByIdMock;

    // テスト対象メソッドを実行
    await useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" });

    // 期待される振る舞い
    expect(mockTodoRepository.findById).toHaveBeenCalledTimes(2);
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("parent-id");
    expect(mockTodoRepository.findById).toHaveBeenCalledWith("subtask-id");
    expect(parentTodo.hasSubtask).toHaveBeenCalledWith("subtask-id");
    expect(mockTodoRepository.removeSubtask).toHaveBeenCalledWith("parent-id", "subtask-id");
  });

  it("should throw TodoNotFoundError when parent todo is not found", async () => {
    // 親タスクが存在しない場合をモック
    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(null));
    mockTodoRepository.findById = findByIdMock;

    // 期待されるエラー
    await expect(useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" })).rejects.toThrow(
      TodoNotFoundError,
    );
  });

  it("should throw TodoNotFoundError when subtask is not found", async () => {
    // 親タスクは存在するがサブタスクが存在しない場合をモック
    const parentTodo = {
      id: "parent-id",
      hasSubtask: mock().mockReturnValue(true),
    } as unknown as Todo;

    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(parentTodo));
    findByIdMock.mockReturnValueOnce(Promise.resolve(null));
    mockTodoRepository.findById = findByIdMock;

    // 期待されるエラー
    await expect(useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" })).rejects.toThrow(
      TodoNotFoundError,
    );
  });

  it("should throw SubtaskNotFoundError when subtask is not associated with parent", async () => {
    // サブタスクは存在するが親タスクと関連付けられていない場合をモック
    const parentTodo = {
      id: "parent-id",
      hasSubtask: mock().mockReturnValue(false), // 関連付けられていない
    } as unknown as Todo;

    const subtaskTodo = {
      id: "subtask-id",
    } as unknown as Todo;

    const findByIdMock = mock();
    findByIdMock.mockReturnValueOnce(Promise.resolve(parentTodo));
    findByIdMock.mockReturnValueOnce(Promise.resolve(subtaskTodo));
    mockTodoRepository.findById = findByIdMock;

    // 期待されるエラー
    await expect(useCase.execute({ parentId: "parent-id", subtaskId: "subtask-id" })).rejects.toThrow(
      SubtaskNotFoundError,
    );
  });
});
