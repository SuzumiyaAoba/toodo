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
  async execute(dto: UpdateWorkPeriodDTO): Promise<WorkPeriod> {
    const { id, startTime, endTime, date, name } = dto;

    // 作業期間が存在するか確認
    const existingWorkPeriod = await this.workPeriodRepository.findById(id);
    if (!existingWorkPeriod) {
      throw new Error(`Work period with id ${id} not found`);
    }

    // 時間範囲の更新がある場合
    if (startTime !== undefined && endTime !== undefined) {
      // 開始時間が終了時間より後の場合はエラー
      if (startTime > endTime) {
        throw new Error("Start time must be before end time");
      }

      // 重複チェック
      const dateToCheck = date || existingWorkPeriod.date;
      const overlapping = await this.workPeriodRepository.findOverlapping(
        startTime,
        endTime,
        dateToCheck,
        id, // 自分自身は除外
      );

      // 重複がある場合はエラー
      if (overlapping.length > 0) {
        throw new Error("This time period overlaps with an existing work period");
      }
    }

    // リポジトリに渡すデータを準備
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (date !== undefined) {
      updateData.date = date;
    }

    if (startTime !== undefined && endTime !== undefined) {
      updateData.startTime = startTime;
      updateData.endTime = endTime;
    } else if (startTime !== undefined) {
      updateData.startTime = startTime;
    } else if (endTime !== undefined) {
      updateData.endTime = endTime;
    }

    // 作業期間を更新
    const updatedWorkPeriod = await this.workPeriodRepository.update(id, updateData);

    return updatedWorkPeriod;
  }
}
