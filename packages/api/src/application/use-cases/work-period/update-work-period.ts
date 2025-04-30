import type { WorkPeriod } from "@toodo/core";
import type { WorkPeriodRepository } from "../../../domain/repositories/work-period-repository";

export interface UpdateWorkPeriodDTO {
  id: string;
  name?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
}

export class UpdateWorkPeriodUseCase {
  constructor(private readonly workPeriodRepository: WorkPeriodRepository) {}

  /**
   * 作業期間を更新
   * @param dto 作業期間更新用のデータ
   * @returns 更新された作業期間
   */
  async execute(input: UpdateWorkPeriodDTO): Promise<WorkPeriod> {
    const { id, ...updateData } = input;
    return this.workPeriodRepository.update(id, updateData);
  }
}
