import * as v from "valibot";
import { CommonSchemas, TodoSchema } from "./todo-schemas";

/**
 * サブタスク関連の入力と出力のスキーマを定義
 */

/**
 * サブタスク操作用のパラメータスキーマ
 */
export const TodoSubtaskParamSchema = v.object({
  id: CommonSchemas.uuid(),
  subtaskId: CommonSchemas.uuid(),
});

/**
 * サブタスク操作用のパラメータ型
 */
export type TodoSubtaskParam = v.InferOutput<typeof TodoSubtaskParamSchema>;

/**
 * サブタスクリスト応答スキーマ
 */
export const SubtaskListSchema = v.array(TodoSchema);

/**
 * サブタスクリスト応答型
 */
export type SubtaskListResponse = v.InferOutput<typeof SubtaskListSchema>;

/**
 * サブタスクツリーノード型
 */
type SubtaskTreeNode = {
  id: string;
  title: string;
  description?: string;
  status: string;
  workState: string;
  priority: string;
  dueDate?: string; // Date型からstring型に変更
  subtasks: SubtaskTreeNode[];
};

/**
 * サブタスクツリーノードスキーマ
 */
export const SubtaskTreeNodeSchema: v.BaseSchema<unknown, SubtaskTreeNode, v.BaseIssue<unknown>> = v.object({
  id: CommonSchemas.uuid(),
  title: v.string(),
  description: CommonSchemas.description(),
  status: CommonSchemas.todoStatus(),
  workState: CommonSchemas.workState(),
  priority: v.string(),
  dueDate: v.optional(v.string()), // Date型からstring型に変更
  subtasks: v.array(v.lazy(() => SubtaskTreeNodeSchema)),
});

/**
 * サブタスクツリー応答スキーマ
 */
export const SubtaskTreeSchema = v.array(SubtaskTreeNodeSchema);

/**
 * サブタスクツリー応答型
 */
export type SubtaskTreeResponse = v.InferOutput<typeof SubtaskTreeSchema>;

/**
 * 新規サブタスク作成リクエストスキーマ
 */
export const CreateSubtaskSchema = v.object({
  parentId: CommonSchemas.uuid(),
  title: CommonSchemas.title(),
  description: CommonSchemas.description(),
  priority: v.optional(v.string()),
});

/**
 * 新規サブタスク作成リクエスト型
 */
export type CreateSubtaskRequest = v.InferOutput<typeof CreateSubtaskSchema>;
