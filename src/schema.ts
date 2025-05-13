import * as v from "valibot";

/**
 * Schema for a TODO item
 */
export const TodoSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.picklist(["pending", "completed"]),
  createdAt: v.pipe(
    v.string(),
    v.regex(
      /^(?:[1-9][0-9]{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9][0-9](?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](?:Z|[+-][01][0-9]:[0-5][0-9])$/,
    ),
    v.transform((date) => new Date(date)),
  ),
  // updatedAt: v.date(),
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
