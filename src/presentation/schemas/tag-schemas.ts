import * as v from "valibot";

/**
 * Schema for tag response
 */
export const TagSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  color: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/)))),
  createdAt: v.string(),
  updatedAt: v.string(),
});

/**
 * Type for tag response
 */
export type TagResponse = v.InferOutput<typeof TagSchema>;

/**
 * Schema for creating a tag
 */
export const CreateTagSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  color: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/)))),
});

/**
 * Type for creating a tag
 */
export type CreateTagRequest = v.InferOutput<typeof CreateTagSchema>;

/**
 * Schema for updating a tag
 */
export const UpdateTagSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(50))),
  color: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/)))),
});

/**
 * Type for updating a tag
 */
export type UpdateTagRequest = v.InferOutput<typeof UpdateTagSchema>;

/**
 * Schema for tag list response
 */
export const TagListSchema = v.array(TagSchema);

/**
 * Type for tag list response
 */
export type TagListResponse = v.InferOutput<typeof TagListSchema>;

/**
 * Schema for tag ID in URL
 */
export const TagIdParamSchema = v.object({
  tagId: v.pipe(v.string(), v.uuid()),
});

/**
 * Type for tag ID in URL
 */
export type TagIdParam = v.InferOutput<typeof TagIdParamSchema>;

/**
 * Schema for multiple tag IDs query parameter
 */
export const MultipleTagQuerySchema = v.object({
  tagIds: v.pipe(
    v.string(),
    v.transform((ids) => ids.split(",")),
    v.array(v.pipe(v.string(), v.uuid())),
  ),
  mode: v.optional(v.picklist(["all", "any"]), "all"),
});

/**
 * Type for multiple tag IDs query
 */
export type MultipleTagQuery = v.InferOutput<typeof MultipleTagQuerySchema>;

/**
 * Schema for bulk tag operations
 */
export const BulkTagOperationSchema = v.object({
  todoIds: v.array(v.pipe(v.string(), v.uuid())),
});

/**
 * Type for bulk tag operations
 */
export type BulkTagOperation = v.InferOutput<typeof BulkTagOperationSchema>;

/**
 * Schema for bulk tag operation response
 */
export const BulkTagOperationResponseSchema = v.object({
  success: v.boolean(),
  message: v.string(),
  tag: v.object({
    id: v.pipe(v.string(), v.uuid()),
    name: v.string(),
    color: v.optional(v.nullable(v.string())),
  }),
  assignedCount: v.optional(v.number()),
  removedCount: v.optional(v.number()),
});

/**
 * Type for bulk tag operation response
 */
export type BulkTagOperationResponse = v.InferOutput<typeof BulkTagOperationResponseSchema>;

/**
 * Schema for tag usage statistics
 */
export const TagStatisticsSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.string(),
  color: v.optional(v.nullable(v.string())),
  usageCount: v.number(),
  pendingTodoCount: v.number(),
  completedTodoCount: v.number(),
});

/**
 * Type for tag usage statistics
 */
export type TagStatistics = v.InferOutput<typeof TagStatisticsSchema>;

/**
 * Schema for tag usage statistics list
 */
export const TagStatisticsListSchema = v.array(TagStatisticsSchema);

/**
 * Type for tag usage statistics list
 */
export type TagStatisticsList = v.InferOutput<typeof TagStatisticsListSchema>;
