import * as v from "valibot";

const ISO8601_DATE_REGEX = /^\d{4}-?\d\d-?\d\d(?:T\d\d(?::?\d\d(?::?\d\d(?:\.\d+)?)?)?(?:Z|[+-]\d\d:?\d\d)?)?$/;

const DateSchema = v.pipe(
  v.string(),
  v.regex(ISO8601_DATE_REGEX),
  v.transform((date) => new Date(date)),
);

/**
 * Schema for a TODO item
 */
export const TodoSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.picklist(["pending", "completed"]),
  createdAt: DateSchema,
  updatedAt: DateSchema,
});

/**
 * Type for a TODO item
 */
export type Todo = v.InferOutput<typeof TodoSchema>;

/**
 * Schema for creating a new TODO
 */
export const CreateTodoSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.optional(v.picklist(["pending", "completed"])),
});

/**
 * Type for creating a new TODO
 */
export type CreateTodo = v.InferOutput<typeof CreateTodoSchema>;

/**
 * Schema for updating a TODO
 */
export const UpdateTodoSchema = v.object({
  title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.optional(v.picklist(["pending", "completed"])),
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
  id: v.pipe(v.string(), v.uuid()),
  todoId: v.pipe(v.string(), v.uuid()),
  type: v.picklist(["started", "paused", "completed", "discarded"]),
  note: v.optional(v.pipe(v.string(), v.maxLength(500))),
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
  note: v.optional(v.pipe(v.string(), v.maxLength(500))),
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
  id: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for params with ID
 */
export type IdParam = v.InferOutput<typeof IdParamSchema>;
