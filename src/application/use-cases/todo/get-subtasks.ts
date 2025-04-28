import * as v from "valibot";
import type { Todo } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * サブタスクを取得するためのInput
 */
export type GetSubtasksInput = {
  todoId: string;
};

/**
 * サブタスクを取得するためのInputスキーマ
 */
export const GetSubtasksInputSchema = v.object({
  todoId: v.pipe(v.string(), v.uuid("Todo ID must be a valid UUID")),
});

/**
 * サブタスクを取得するユースケース
 */
export class GetSubtasksUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * 特定の親タスクに紐づくサブタスクを取得する
   */
  async execute({ todoId }: GetSubtasksInput): Promise<Todo[]> {
    // 親タスクが存在するか確認
    const parentTodo = await this.todoRepository.findById(todoId);
    if (!parentTodo) {
      throw new TodoNotFoundError(todoId);
    }

    // サブタスクを取得
    return this.todoRepository.findByParent(todoId);
  }
}
