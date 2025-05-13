import * as v from "valibot";
import type { TagRepository } from "../../../domain/repositories/tag-repository";

/**
 * Input for deleting a tag
 */
export type DeleteTagInput = {
  id: string;
};

/**
 * Schema for deleting a tag
 */
export const DeleteTagInputSchema = v.object({
  id: v.pipe(v.string(), v.uuid("ID must be a valid UUID")),
});

/**
 * Use case for deleting a tag
 */
export class DeleteTagUseCase {
  constructor(private tagRepository: TagRepository) {}

  /**
   * Execute the use case
   * @param input Input for deleting a tag
   */
  async execute(input: DeleteTagInput): Promise<void> {
    // Validate input
    const validated = v.parse(DeleteTagInputSchema, input);

    // Check if tag exists
    const existingTag = await this.tagRepository.getTagById(validated.id);
    if (!existingTag) {
      throw new Error(`Tag with ID '${validated.id}' not found`);
    }

    // Delete tag
    await this.tagRepository.deleteTag(validated.id);
  }
}
