import * as v from "valibot";
import { CommonSchemas, TodoSchema } from "./todo-schemas";

/**
 * Schema definitions for subtask inputs and outputs
 */

/**
 * Parameter schema for subtask operations
 */
export const TodoSubtaskParamSchema = v.object({
  id: CommonSchemas.uuid(),
  subtaskId: CommonSchemas.uuid(),
});

/**
 * Parameter type for subtask operations
 */
export type TodoSubtaskParam = v.InferOutput<typeof TodoSubtaskParamSchema>;

/**
 * Subtask list response schema
 */
export const SubtaskListSchema = v.array(TodoSchema);

/**
 * Subtask list response type
 */
export type SubtaskListResponse = v.InferOutput<typeof SubtaskListSchema>;

/**
 * Subtask tree node type
 */
type SubtaskTreeNode = {
  id: string;
  title: string;
  description?: string;
  status: string;
  workState: string;
  priority: string; // Maintaining string type for consistency
  dueDate?: string; // Changed from Date type to string type
  subtasks: SubtaskTreeNode[];
};

/**
 * Subtask tree node schema
 */
export const SubtaskTreeNodeSchema: v.BaseSchema<unknown, SubtaskTreeNode, v.BaseIssue<unknown>> = v.object({
  id: CommonSchemas.uuid(),
  title: v.string(),
  description: CommonSchemas.description(),
  status: CommonSchemas.todoStatus(),
  workState: CommonSchemas.workState(),
  priority: CommonSchemas.priorityLevel(), // Using CommonSchemas for consistency
  dueDate: v.optional(v.string()), // Changed from Date type to string type
  subtasks: v.array(v.lazy(() => SubtaskTreeNodeSchema)),
});

/**
 * Subtask tree response schema
 */
export const SubtaskTreeSchema = v.array(SubtaskTreeNodeSchema);

/**
 * Subtask tree response type
 */
export type SubtaskTreeResponse = v.InferOutput<typeof SubtaskTreeSchema>;

/**
 * Create subtask request schema
 */
export const CreateSubtaskSchema = v.object({
  parentId: CommonSchemas.uuid(),
  title: CommonSchemas.title(),
  description: CommonSchemas.description(),
  priority: v.optional(CommonSchemas.priorityLevel()), // Using CommonSchemas for consistency
});

/**
 * Create subtask request type
 */
export type CreateSubtaskRequest = v.InferOutput<typeof CreateSubtaskSchema>;
