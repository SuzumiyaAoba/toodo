import * as v from "valibot";
import type { Tag } from "../../../domain/entities/tag";
import type { TagRepository } from "../../../domain/repositories/tag-repository";

/**
 * Input for updating a tag
 */
export type UpdateTagInput = {
  id: string;
  name?: string;
  color?: string | null;
};

/**
 * Schema for updating a tag
 */
export const UpdateTagInputSchema = v.object({
  id: v.pipe(v.string(), v.uuid("ID must be a valid UUID")),
  name: v.optional(
    v.pipe(
      v.string(),
      v.minLength(1, "Name must be at least 1 character long"),
      v.maxLength(50, "Name must be at most 50 characters long"),
    ),
  ),
  color: v.optional(
    v.nullable(
      v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code (e.g., #FF5733)")),
    ),
  ),
});

/**
 * Use case for updating a tag
 */
export class UpdateTagUseCase {
  constructor(private tagRepository: TagRepository) {}

  /**
   * Execute the use case
   * @param input Input for updating a tag
   * @returns The updated tag
   */
  async execute(input: UpdateTagInput): Promise<Tag> {
    // Validate input
    const validated = v.parse(UpdateTagInputSchema, input);

    // Check if tag exists
    const existingTag = await this.tagRepository.getTagById(validated.id);
    if (!existingTag) {
      throw new Error(`Tag with ID '${validated.id}' not found`);
    }

    // Check if name is changed and if a tag with the new name already exists
    if (validated.name && validated.name !== existingTag.name) {
      const tagWithSameName = await this.tagRepository.getTagByName(validated.name);
      if (tagWithSameName && tagWithSameName.id !== validated.id) {
        throw new Error(`Tag with name '${validated.name}' already exists`);
      }
    }

    // Update tag
    return this.tagRepository.updateTag(validated.id, validated.name ?? undefined, validated.color ?? undefined);
  }
}
