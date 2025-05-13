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
  workState: v.picklist(["idle", "active", "paused", "completed"]),
  totalWorkTime: v.number(),
  lastStateChangeAt: DateSchema,
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
  workState: v.optional(v.picklist(["idle", "active", "paused", "completed"])),
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
  workState: v.optional(v.picklist(["idle", "active", "paused", "completed"])),
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
  workTime: v.optional(v.number()),
  previousState: v.optional(v.picklist(["idle", "active", "paused", "completed"])),
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
 * Schema for work time response
 */
export const WorkTimeResponseSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
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
  id: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for params with ID
 */
export type IdParam = v.InferOutput<typeof IdParamSchema>;

/**
 * Schema for TODO and Activity ID params
 */
export const TodoActivityIdParamSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  activityId: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for TODO and Activity ID params
 */
export type TodoActivityIdParam = v.InferOutput<typeof TodoActivityIdParamSchema>;
