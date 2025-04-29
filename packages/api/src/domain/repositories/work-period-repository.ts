import type { WorkPeriod, WorkPeriodCreateInput } from "@toodo/core";

export interface WorkPeriodStatistics {
  totalWorkPeriodTime: number; // 稼働時間の合計（ミリ秒）
  totalActivityTime: number; // アクティビティの合計時間（ミリ秒）
  utilizationRate: number; // 使用率（0-1の間）
  activitiesByTag: Record<string, number>; // タグごとのアクティビティ時間
  activitiesByTodo: Record<string, number>; // TODOごとのアクティビティ時間
}

export interface WorkPeriodStatisticsOptions {
  startDate?: Date; // 集計開始日
  endDate?: Date; // 集計終了日
  tagIds?: string[]; // 特定のタグに限定
  todoIds?: string[]; // 特定のTODOに限定
  workPeriodIds?: string[]; // 特定の稼働時間に限定
}

/**
 * WorkPeriodRepository interface
 */
export interface WorkPeriodRepository {
  /**
   * Find all work periods
   */
  findAll(): Promise<WorkPeriod[]>;

  /**
   * Find work period by id
   * @param id Work period id
   */
  findById(id: string): Promise<WorkPeriod | null>;

  /**
   * Find work periods by date range
   * @param startDate Start date
   * @param endDate End date
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<WorkPeriod[]>;

  /**
   * Create work period
   * @param workPeriod Work period data to create
   */
  create(workPeriod: WorkPeriodCreateInput): Promise<WorkPeriod>;

  /**
   * Update work period
   * @param id Work period id
   * @param workPeriod Work period data to update
   */
  update(id: string, workPeriod: Partial<WorkPeriodCreateInput>): Promise<WorkPeriod>;

  /**
   * Delete work period
   * @param id Work period id
   */
  delete(id: string): Promise<void>;

  /**
   * Get statistics for work periods
   * @param options Statistics options
   */
  getStatistics(options?: WorkPeriodStatisticsOptions): Promise<WorkPeriodStatistics>;

  /**
   * Find overlapping work periods
   * @param startTime Start time
   * @param endTime End time
   * @param date Date
   * @param excludeId Exclude this work period id
   */
  findOverlapping(startTime: Date, endTime: Date, date: Date, excludeId?: string): Promise<WorkPeriod[]>;
}
