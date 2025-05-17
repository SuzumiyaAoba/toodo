import { z } from "zod";

// Basic type definitions
export const taskStatusSchema = z.enum(["completed", "incomplete"]);

// ID validation
export const idSchema = z.string().uuid();

// Schema for task creation
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less"),
  description: z.string().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

// Schema for task update
export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(100, "Title must be 100 characters or less").optional(),
  description: z.string().nullable().optional(),
  status: taskStatusSchema.optional(),
});

// Schema for task movement
export const moveTaskSchema = z.object({
  taskId: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
});

// Schema for task reordering
export const reorderTasksSchema = z.object({
  parentId: z.string().uuid().nullable(),
  orderMap: z.record(z.string().uuid(), z.number().int().positive()),
});

// Schema for pagination
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ReorderTasksInput = z.infer<typeof reorderTasksSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
