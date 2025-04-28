import * as v from "valibot";
import type { Todo } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * サブタスクを追加するためのInput
 */
export type AddSubtaskInput = {
  parentId: string;
  subtaskId: string;
};

/**
 * サブタスクを追加するためのInputスキーマ
 */
export const AddSubtaskInputSchema = v.object({
  parentId: v.pipe(v.string(), v.uuid("Parent ID must be a valid UUID")),
  subtaskId: v.pipe(v.string(), v.uuid("Subtask ID must be a valid UUID")),
});

/**
 * サブタスクを追加するユースケース
 */
export class AddSubtaskUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * サブタスクを追加する
   */
  async execute({ parentId, subtaskId }: AddSubtaskInput): Promise<void> {
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

    // サブタスクを追加
    await this.todoRepository.addSubtask(parentId, subtaskId);
  }
}
