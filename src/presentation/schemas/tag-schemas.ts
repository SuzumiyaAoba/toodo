import * as v from "valibot";

/**
 * Schema for tag response
 */
export const TagSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  color: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/))),
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
  color: v.optional(v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/))),
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
