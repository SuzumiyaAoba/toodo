import type { TodoActivity } from "@toodo/core";

/**
 * TodoActivityRepository interface
 */
export interface TodoActivityRepository {
  /**
   * Find todo activities by todo id
   * @param todoId Todo id
   */
  findByTodoId(todoId: string): Promise<TodoActivity[]>;

  /**
   * Find todo activity by id
   * @param id Activity id
   */
  findById(id: string): Promise<TodoActivity | null>;

  /**
   * Create todo activity
   * @param activity Activity data to create
   */
  create(activity: Omit<TodoActivity, "id" | "createdAt">): Promise<TodoActivity>;

  /**
   * Update todo activity's work period
   * @param id Activity id
   * @param workPeriodId Work period id
   */
  updateWorkPeriod(id: string, workPeriodId: string | null): Promise<TodoActivity | null>;

  /**
   * Find activities by work period id
   * @param workPeriodId Work period id
   */
  findByWorkPeriodId(workPeriodId: string): Promise<TodoActivity[]>;

  /**
   * Find activities within a date range
   * @param startDate Start date
   * @param endDate End date
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<TodoActivity[]>;

  /**
   * Delete todo activity
   * @param id Activity id
   */
  delete(id: string): Promise<void>;

  /**
   * Update todo activity
   * @param id Activity id
   * @param todoActivity Partial todo activity data
   */
  update(id: string, todoActivity: Partial<TodoActivity>): Promise<TodoActivity | null>;

  /**
   * Get total work time for a todo
   * @param todoId Todo id
   */
  getTotalWorkTime(todoId: string): Promise<number>;

  /**
   * Find activities by work period
   * @param workPeriodId Work period id
   */
  findByWorkPeriod(workPeriodId: string): Promise<TodoActivity[]>;
}
