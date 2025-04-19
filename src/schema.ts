import * as v from "valibot";

/**
 * Schema for a TODO item
 */
export const TodoSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  status: v.picklist(["pending", "completed"]),
  createdAt: v.date(),
  updatedAt: v.date(),
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
