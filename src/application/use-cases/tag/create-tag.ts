import * as v from "valibot";
import type { Tag } from "../../../domain/entities/tag";
import type { TagRepository } from "../../../domain/repositories/tag-repository";

/**
 * Input for creating a tag
 */
export type CreateTagInput = {
  name: string;
  color?: string;
};

/**
 * Schema for creating a tag
 */
export const CreateTagInputSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, "Name must be at least 1 character long"),
    v.maxLength(50, "Name must be at most 50 characters long"),
  ),
  color: v.optional(
    v.pipe(v.string(), v.regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color code (e.g., #FF5733)")),
  ),
});

/**
 * Use case for creating a tag
 */
export class CreateTagUseCase {
  constructor(private tagRepository: TagRepository) {}

  /**
   * Execute the use case
   * @param input Input for creating a tag
   * @returns The created tag
   */
  async execute(input: CreateTagInput): Promise<Tag> {
    // Validate input
    const validated = v.parse(CreateTagInputSchema, input);

    // Check if tag with same name already exists
    const existingTag = await this.tagRepository.getTagByName(validated.name);
    if (existingTag) {
      throw new Error(`Tag with name '${validated.name}' already exists`);
    }

    // Create tag
    return this.tagRepository.createTag(validated.name, validated.color);
  }
}
