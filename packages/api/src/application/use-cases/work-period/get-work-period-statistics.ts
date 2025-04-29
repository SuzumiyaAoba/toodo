import type {
  WorkPeriodRepository,
  WorkPeriodStatistics,
  WorkPeriodStatisticsOptions,
} from "../../../domain/repositories/work-period-repository";

export interface GetWorkPeriodStatisticsDTO extends WorkPeriodStatisticsOptions {}

export class GetWorkPeriodStatisticsUseCase {
  constructor(private readonly workPeriodRepository: WorkPeriodRepository) {}

  async execute(options: GetWorkPeriodStatisticsDTO): Promise<WorkPeriodStatistics> {
    return this.workPeriodRepository.getStatistics(options);
  }
}
