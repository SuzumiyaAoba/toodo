import * as v from "valibot";
import { SubtaskNotFoundError, TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * サブタスクの親タスクからの関連付けを解除するためのInput
 */
export type RemoveSubtaskInput = {
  parentId: string;
  subtaskId: string;
};

/**
 * サブタスクを削除するためのInputスキーマ
 */
export const RemoveSubtaskInputSchema = v.object({
  parentId: v.pipe(v.string(), v.uuid("Parent ID must be a valid UUID")),
  subtaskId: v.pipe(v.string(), v.uuid("Subtask ID must be a valid UUID")),
});

/**
 * サブタスクを削除するユースケース
 */
export class RemoveSubtaskUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * サブタスクを削除する
   */
  async execute({ parentId, subtaskId }: RemoveSubtaskInput): Promise<void> {
    // 親タスクが存在するか確認
    const parentTodo = await this.todoRepository.findById(parentId);
    if (!parentTodo) {
      throw new TodoNotFoundError(parentId);
    }

    // サブタスクが存在するか確認
    const subtaskTodo = await this.todoRepository.findById(subtaskId);
    if (!subtaskTodo) {
      throw new TodoNotFoundError(subtaskId);
    }

    // サブタスクが親タスクのサブタスクとして登録されているか確認
    if (!parentTodo.hasSubtask(subtaskId)) {
      throw new SubtaskNotFoundError(subtaskId, parentId);
    }

    // サブタスクを削除
    await this.todoRepository.removeSubtask(parentId, subtaskId);
  }
}
