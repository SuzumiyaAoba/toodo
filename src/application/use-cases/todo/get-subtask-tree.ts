import * as v from "valibot";
import type { Todo } from "../../../domain/entities/todo";
import { TodoNotFoundError } from "../../../domain/errors/todo-errors";
import type { TodoRepository } from "../../../domain/repositories/todo-repository";

/**
 * サブタスク階層を取得するためのInput
 */
export type GetSubtaskTreeInput = {
  todoId: string;
  maxDepth?: number;
};

/**
 * サブタスク階層を取得するためのInputスキーマ
 */
export const GetSubtaskTreeInputSchema = v.object({
  todoId: v.pipe(v.string(), v.uuid("Todo ID must be a valid UUID")),
  maxDepth: v.optional(v.number("Max depth must be a number"), 10),
});

/**
 * サブタスク階層を取得するユースケース
 */
export class GetSubtaskTreeUseCase {
  constructor(private todoRepository: TodoRepository) {}

  /**
   * 特定の親タスクに紐づくサブタスク階層を取得する
   */
  async execute({ todoId, maxDepth = 10 }: GetSubtaskTreeInput): Promise<Todo[]> {
    // 親タスクが存在するか確認
    const parentTodo = await this.todoRepository.findById(todoId);
    if (!parentTodo) {
      throw new TodoNotFoundError(todoId);
    }

    // サブタスク階層を取得
    return this.todoRepository.findChildrenTree(todoId, maxDepth);
  }
}
