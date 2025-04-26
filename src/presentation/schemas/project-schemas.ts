import * as v from "valibot";
import { projectStatusSchema } from "../../domain/entities/project";

export const createProjectRequestSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  color: v.optional(v.string()),
  status: v.optional(projectStatusSchema),
});

export const updateProjectRequestSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  description: v.optional(v.pipe(v.string(), v.maxLength(1000))),
  color: v.optional(v.string()),
  status: v.optional(projectStatusSchema),
});

export const addTodoToProjectRequestSchema = v.object({
  todoId: v.pipe(v.string(), v.uuid()),
});

export type CreateProjectRequest = v.InferOutput<typeof createProjectRequestSchema>;
export type UpdateProjectRequest = v.InferOutput<typeof updateProjectRequestSchema>;
export type AddTodoToProjectRequest = v.InferOutput<typeof addTodoToProjectRequestSchema>;
