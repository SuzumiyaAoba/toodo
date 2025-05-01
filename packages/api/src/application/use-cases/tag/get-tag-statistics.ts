import type { TagRepository } from "../../../domain/repositories/tag-repository";

/**
 * TagStatistics interface representing tag usage statistics
 */
export interface TagStatistics {
  id: string;
  name: string;
  color: string | null;
  usageCount: number;
  pendingTodoCount: number;
  completedTodoCount: number;
}

/**
 * Use case for getting tag usage statistics
 */
export class GetTagStatisticsUseCase {
  constructor(private tagRepository: TagRepository) {}

  /**
   * Execute the use case
   * @returns List of tags with their usage statistics
   */
  async execute(): Promise<TagStatistics[]> {
    // Get tag statistics from repository
    const statistics = await this.tagRepository.getTagStatistics();

    return statistics;
  }
}
