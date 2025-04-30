import {
  array,
  boolean,
  literal,
  maxLength,
  minLength,
  nullable,
  number,
  object,
  optional,
  pipe,
  regex,
  string,
  union,
  uuid,
} from "valibot";
import type { InferOutput } from "valibot";

/**
 * Schema for Tag responses
 */
export const TagSchema = object({
  id: string(),
  name: string(),
  color: optional(string()),
  createdAt: string(),
  updatedAt: string(),
});

/**
 * Schema for Tag query parameters
 */
export const MultipleTagQuerySchema = object({
  tagIds: array(string()),
  mode: union([literal("all"), literal("any")]),
});

/**
 * Schema for bulk tag operations
 */
export const BulkTagOperationSchema = object({
  tagIds: array(string()),
  todoIds: array(string()),
});

/**
 * Type for Tag response
 */
export type TagResponse = InferOutput<typeof TagSchema>;

/**
 * Schema for creating a tag
 */
export const CreateTagSchema = object({
  name: pipe(string(), minLength(1), maxLength(50)),
  color: optional(nullable(pipe(string(), regex(/^#[0-9A-Fa-f]{6}$/)))),
});

/**
 * Type for creating a tag
 */
export type CreateTagRequest = InferOutput<typeof CreateTagSchema>;

/**
 * Schema for updating a tag
 */
export const UpdateTagSchema = object({
  name: optional(pipe(string(), minLength(1), maxLength(50))),
  color: optional(nullable(pipe(string(), regex(/^#[0-9A-Fa-f]{6}$/)))),
});

/**
 * Type for updating a tag
 */
export type UpdateTagRequest = InferOutput<typeof UpdateTagSchema>;

/**
 * Schema for tag list response
 */
export const TagListSchema = array(TagSchema);

/**
 * Type for tag list response
 */
export type TagListResponse = InferOutput<typeof TagListSchema>;

/**
 * Schema for tag ID in URL
 */
export const TagIdParamSchema = object({
  tagId: pipe(string(), uuid()),
});

/**
 * Type for tag ID in URL
 */
export type TagIdParam = InferOutput<typeof TagIdParamSchema>;

/**
 * Type for multiple tag IDs query
 */
export type MultipleTagQuery = InferOutput<typeof MultipleTagQuerySchema>;

/**
 * Type for bulk tag operation response
 */
export const BulkTagOperationResponseSchema = object({
  success: boolean(),
  message: string(),
  tag: object({
    id: pipe(string(), uuid()),
    name: string(),
    color: optional(nullable(string())),
  }),
  assignedCount: optional(number()),
  removedCount: optional(number()),
});

/**
 * Type for bulk tag operation response
 */
export type BulkTagOperationResponse = InferOutput<typeof BulkTagOperationResponseSchema>;

/**
 * Schema for tag usage statistics
 */
export const TagStatisticsSchema = object({
  id: pipe(string(), uuid()),
  name: string(),
  color: optional(nullable(string())),
  usageCount: number(),
  pendingTodoCount: number(),
  completedTodoCount: number(),
});

/**
 * Type for tag usage statistics
 */
export type TagStatistics = InferOutput<typeof TagStatisticsSchema>;

/**
 * Schema for tag usage statistics list
 */
export const TagStatisticsListSchema = array(TagStatisticsSchema);

/**
 * Type for tag usage statistics list
 */
export type TagStatisticsList = InferOutput<typeof TagStatisticsListSchema>;
