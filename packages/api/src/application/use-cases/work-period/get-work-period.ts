import type { WorkPeriod } from "@toodo/core";
import type { WorkPeriodRepository } from "../../../domain/repositories/work-period-repository";

export class GetWorkPeriodUseCase {
  constructor(private readonly workPeriodRepository: WorkPeriodRepository) {}

  async execute(id: string): Promise<WorkPeriod | null> {
    return this.workPeriodRepository.findById(id);
  }
}
