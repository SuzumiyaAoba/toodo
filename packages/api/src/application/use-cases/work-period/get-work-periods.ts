import type { WorkPeriod } from "@toodo/core";
import type { WorkPeriodRepository } from "../../../domain/repositories/work-period-repository";

export interface GetWorkPeriodsDTO {
  startDate?: Date;
  endDate?: Date;
}

export class GetWorkPeriodsUseCase {
  constructor(private readonly workPeriodRepository: WorkPeriodRepository) {}

  async execute(input?: GetWorkPeriodsDTO): Promise<WorkPeriod[]> {
    if (input?.startDate && input?.endDate) {
      return this.workPeriodRepository.findByDateRange(input.startDate, input.endDate);
    }

    return this.workPeriodRepository.findAll();
  }
}
