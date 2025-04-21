import * as v from "valibot";
import type { Tag } from "../../../domain/entities/tag";
import type { TagRepository } from "../../../domain/repositories/tag-repository";

/**
 * Use case for getting all tags
 */
export class GetAllTagsUseCase {
  constructor(private tagRepository: TagRepository) {}

  /**
   * Execute the use case
   * @returns List of all tags
   */
  async execute(): Promise<Tag[]> {
    return this.tagRepository.getAllTags();
  }
}

/**
 * Input for getting a tag by ID
 */
export type GetTagByIdInput = {
  id: string;
};

/**
 * Schema for getting a tag by ID
 */
export const GetTagByIdInputSchema = v.object({
  id: v.pipe(v.string(), v.uuid("ID must be a valid UUID")),
});

/**
 * Use case for getting a tag by ID
 */
export class GetTagByIdUseCase {
  constructor(private tagRepository: TagRepository) {}

  /**
   * Execute the use case
   * @param input Input containing tag ID
   * @returns The tag or null if not found
   */
  async execute(input: GetTagByIdInput): Promise<Tag | null> {
    const validated = v.parse(GetTagByIdInputSchema, input);
    return this.tagRepository.getTagById(validated.id);
  }
}
