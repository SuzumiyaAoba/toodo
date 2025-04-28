import { type InferOutput, maxLength, minLength, object, optional, pipe, string } from "valibot";

export const ProjectSchema = object({
  id: string(),
  name: pipe(string(), minLength(1, "Name is required"), maxLength(100, "Name is too long")),
  description: optional(pipe(string(), maxLength(500, "Description is too long"))),
  color: optional(string()),
  createdAt: string(),
  updatedAt: string(),
});

export type ProjectResponse = InferOutput<typeof ProjectSchema>;

export const UpdateProjectSchema = object({
  name: optional(pipe(string(), minLength(1, "Name is required"), maxLength(100, "Name is too long"))),
  description: optional(pipe(string(), maxLength(500, "Description is too long"))),
  color: optional(string()),
});

export type UpdateProjectRequest = InferOutput<typeof UpdateProjectSchema>;

export const createProjectRequestSchema = object({
  name: pipe(string(), minLength(1, "Name is required"), maxLength(100, "Name is too long")),
  description: optional(pipe(string(), maxLength(500, "Description is too long"))),
  color: optional(string()),
});

export type CreateProjectRequest = InferOutput<typeof createProjectRequestSchema>;

export const updateProjectRequestSchema = object({
  name: optional(pipe(string(), minLength(1, "Name is required"), maxLength(100, "Name is too long"))),
  description: optional(pipe(string(), maxLength(500, "Description is too long"))),
  color: optional(string()),
});

export const addTodoToProjectRequestSchema = object({
  todoId: string(),
});

export type AddTodoToProjectRequest = InferOutput<typeof addTodoToProjectRequestSchema>;
