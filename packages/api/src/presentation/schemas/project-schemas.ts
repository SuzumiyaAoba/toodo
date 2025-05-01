import { type InferOutput, maxLength, minLength, object, optional, pipe, regex, string, uuid } from "valibot";

export const ProjectSchema = object({
  id: pipe(string(), uuid("ID must be a valid UUID")),
  name: pipe(string(), minLength(1, "Name is required"), maxLength(100, "Name is too long")),
  description: optional(pipe(string(), maxLength(500, "Description is too long"))),
  color: optional(pipe(string(), regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code (e.g., #FF5733)"))),
  createdAt: string(),
  updatedAt: string(),
});

export type Project = InferOutput<typeof ProjectSchema>;

export const UpdateProjectSchema = object({
  name: optional(pipe(string(), minLength(1, "Name is required"), maxLength(100, "Name is too long"))),
  description: optional(pipe(string(), maxLength(500, "Description is too long"))),
  color: optional(pipe(string(), regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code (e.g., #FF5733)"))),
});

export type UpdateProjectRequest = InferOutput<typeof UpdateProjectSchema>;

export const createProjectRequestSchema = object({
  name: pipe(string(), minLength(1, "Name is required"), maxLength(100, "Name is too long")),
  description: optional(pipe(string(), maxLength(500, "Description is too long"))),
  color: optional(pipe(string(), regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code (e.g., #FF5733)"))),
});

export type CreateProjectRequest = InferOutput<typeof createProjectRequestSchema>;

export const updateProjectRequestSchema = object({
  name: optional(pipe(string(), minLength(1, "Name is required"), maxLength(100, "Name is too long"))),
  description: optional(pipe(string(), maxLength(500, "Description is too long"))),
  color: optional(pipe(string(), regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code (e.g., #FF5733)"))),
});

export const addTodoToProjectRequestSchema = object({
  todoId: string(),
});

export type AddTodoToProjectRequest = InferOutput<typeof addTodoToProjectRequestSchema>;
