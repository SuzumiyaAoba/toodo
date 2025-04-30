import { array, date, object, optional, string } from "valibot";

/**
 * Schema for Work Period responses
 */
export const WorkPeriodSchema = object({
  id: string(),
  name: string(),
  date: optional(string()),
  startTime: string(),
  endTime: string(),
  activities: optional(array(string())),
  createdAt: string(),
  updatedAt: string(),
});
