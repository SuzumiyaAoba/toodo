import type { WorkPeriodRepository } from "../../../domain/repositories/work-period-repository";

export interface DeleteWorkPeriodDTO {
  id: string;
}

export class DeleteWorkPeriodUseCase {
  constructor(private readonly workPeriodRepository: WorkPeriodRepository) {}

  async execute(input: DeleteWorkPeriodDTO): Promise<void> {
    const existingWorkPeriod = await this.workPeriodRepository.findById(input.id);
    if (!existingWorkPeriod) {
      throw new Error(`Work period with id ${input.id} not found`);
    }

    await this.workPeriodRepository.delete(input.id);
  }
}
