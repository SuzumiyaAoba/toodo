/**
 * Error thrown when a work period is not found
 */
export class WorkPeriodNotFoundError extends Error {
  constructor(workPeriodId: string) {
    super(`Work period with ID '${workPeriodId}' not found`);
    this.name = "WorkPeriodNotFoundError";
  }
}
