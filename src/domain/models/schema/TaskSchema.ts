import { z } from "zod";

/**
 * Schema definitions for task-related operations
 * Using Zod for validation and type inference
 */

/**
 * Valid task status values
 */
export const taskStatusSchema = z.enum(["completed", "incomplete"]);

/**
 * UUID validation schema for task IDs
 */
export const idSchema = z.string().uuid("Task ID must be a valid UUID");

/**
 * Schema for task creation
 * Validates input when creating a new task
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid("Parent ID must be a valid UUID").nullable().optional(),
});

/**
 * Schema for task update
 * Validates input when updating an existing task
 */
export const updateTaskSchema = z.object({
  id: z.string().uuid("Task ID must be a valid UUID"),
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less").optional(),
  description: z.string().nullable().optional(),
  status: taskStatusSchema.optional(),
});

/**
 * Schema for task movement
 * Validates input when moving a task to a new parent
 */
export const moveTaskSchema = z.object({
  taskId: z.string().uuid("Task ID must be a valid UUID"),
  newParentId: z.string().uuid("Parent ID must be a valid UUID").nullable(),
});

/**
 * Schema for task reordering
 * Validates input when reordering tasks within a parent
 */
export const reorderTasksSchema = z.object({
  parentId: z.string().uuid("Parent ID must be a valid UUID").nullable(),
  orderMap: z.record(
    z.string().uuid("Task ID must be a valid UUID"),
    z.number().int("Order must be an integer").positive("Order must be positive"),
  ),
});

/**
 * Schema for pagination
 * Handles conversion from string to number for query parameters
 */
export const paginationSchema = z.object({
  page: z
    .preprocess(
      (v) => (typeof v === "string" ? Number(v) : v),
      z.number().int("Page must be an integer").positive("Page must be positive"),
    )
    .default(1),
  limit: z
    .preprocess(
      (v) => (typeof v === "string" ? Number(v) : v),
      z.number().int("Limit must be an integer").positive("Limit must be positive").max(100, "Maximum limit is 100"),
    )
    .default(20),
});

/**
 * Type exports for use in application code
 */
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
