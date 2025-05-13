import * as v from "valibot";
import { CommonSchemas, DateSchema } from "./presentation/schemas/todo-schemas";

/**
 * Schema for a TODO item
 */
export const TodoSchema = v.object({
  id: CommonSchemas.uuid(),
  title: CommonSchemas.title(),
  description: CommonSchemas.description(),
  status: v.picklist(["pending", "completed"]),
  workState: v.picklist(["idle", "active", "paused", "completed"]),
  totalWorkTime: v.number(),
  lastStateChangeAt: DateSchema,
  createdAt: DateSchema,
  updatedAt: DateSchema,
  priority: v.string(),
});

/**
 * Type for a TODO item
 */
export type Todo = v.InferOutput<typeof TodoSchema>;

/**
 * Schema for creating a new TODO
 */
export const CreateTodoSchema = v.object({
  title: CommonSchemas.title(),
  description: CommonSchemas.description(),
  status: v.optional(v.picklist(["pending", "completed"])),
  workState: v.optional(v.picklist(["idle", "active", "paused", "completed"])),
  priority: v.optional(v.string()),
});

/**
 * Type for creating a new TODO
 */
export type CreateTodo = v.InferOutput<typeof CreateTodoSchema>;

/**
 * Schema for updating a TODO
 */
export const UpdateTodoSchema = v.object({
  title: v.optional(CommonSchemas.title()),
  description: CommonSchemas.description(),
  status: v.optional(v.picklist(["pending", "completed"])),
  workState: v.optional(v.picklist(["idle", "active", "paused", "completed"])),
  priority: v.optional(v.string()),
});

/**
 * Type for updating a TODO
 */
export type UpdateTodo = v.InferOutput<typeof UpdateTodoSchema>;

/**
 * Schema for TODO response list
 */
export const TodoListSchema = v.array(TodoSchema);

/**
 * Type for TODO response list
 */
export type TodoList = v.InferOutput<typeof TodoListSchema>;

/**
 * Schema for a TODO activity
 */
export const TodoActivitySchema = v.object({
  id: CommonSchemas.uuid(),
  todoId: CommonSchemas.uuid(),
  type: v.picklist(["started", "paused", "completed", "discarded"]),
  workTime: v.optional(v.number()),
  previousState: v.optional(v.picklist(["idle", "active", "paused", "completed"])),
  note: CommonSchemas.note(),
  createdAt: DateSchema,
});

/**
 * Type for a TODO activity
 */
export type TodoActivity = v.InferOutput<typeof TodoActivitySchema>;

/**
 * Schema for creating a new TODO activity
 */
export const CreateTodoActivitySchema = v.object({
  type: v.picklist(["started", "paused", "completed", "discarded"]),
  note: CommonSchemas.note(),
});

/**
 * Type for creating a new TODO activity
 */
export type CreateTodoActivity = v.InferOutput<typeof CreateTodoActivitySchema>;

/**
 * Schema for TODO activity response list
 */
export const TodoActivityListSchema = v.array(TodoActivitySchema);

/**
 * Type for TODO activity response list
 */
export type TodoActivityList = v.InferOutput<typeof TodoActivityListSchema>;

/**
 * Schema for work time response
 */
export const WorkTimeResponseSchema = v.object({
  id: CommonSchemas.uuid(),
  totalWorkTime: v.number(),
  workState: v.picklist(["idle", "active", "paused", "completed"]),
  formattedTime: v.string(),
});

/**
 * Type for work time response
 */
export type WorkTimeResponse = v.InferOutput<typeof WorkTimeResponseSchema>;

/**
 * Schema for error responses
 */
export const ErrorResponseSchema = v.object({
  error: v.string(),
});

/**
 * Type for error responses
 */
export type ErrorResponse = v.InferOutput<typeof ErrorResponseSchema>;

/**
 * Schema for params with ID
 */
export const IdParamSchema = v.object({
  id: CommonSchemas.uuid(),
});

/**
 * Type for params with ID
 */
export type IdParam = v.InferOutput<typeof IdParamSchema>;

/**
 * Schema for TODO and Activity ID params
 */
export const TodoActivityIdParamSchema = v.object({
  id: CommonSchemas.uuid(),
  activityId: CommonSchemas.uuid(),
});

/**
 * Type for TODO and Activity ID params
 */
export type TodoActivityIdParam = v.InferOutput<typeof TodoActivityIdParamSchema>;
