import { randomUUID } from "node:crypto";
import type { WorkPeriod } from "@toodo/core";
import type { WorkPeriodRepository } from "../../../domain/repositories/work-period-repository";

export interface CreateWorkPeriodDTO {
  name: string;
  date?: Date;
  startTime: Date;
  endTime: Date;
}

export class CreateWorkPeriodUseCase {
  constructor(private readonly workPeriodRepository: WorkPeriodRepository) {}

  /**
   * 新しい作業期間を作成
   * @param dto 作業期間作成用のデータ
   * @returns 作成された作業期間
   */
  async execute(input: CreateWorkPeriodDTO): Promise<WorkPeriod> {
    // 重複チェック
    const { startTime, endTime, date } = input;
    const overlapping = await this.workPeriodRepository.findOverlapping(startTime, endTime, date ?? new Date());

    // 重複がある場合はエラー
    if (overlapping.length > 0) {
      throw new Error("This time period overlaps with an existing work period");
    }

    // 開始時間が終了時間より後の場合はエラー
    if (startTime > endTime) {
      throw new Error("Start time must be before end time");
    }

    // 作業期間を作成
    const workPeriod = await this.workPeriodRepository.create({
      name: input.name,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
    });

    return workPeriod;
  }
}
