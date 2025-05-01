import { array, object, optional, string } from "valibot";
import { TodoActivitySchema } from "./todo-schemas";

/**
 * Schema for Work Period responses
 */
export const WorkPeriodSchema = object({
  id: string(),
  name: string(),
  date: optional(string()),
  startTime: string(),
  endTime: string(),
  activities: optional(array(TodoActivitySchema)),
  createdAt: string(),
  updatedAt: string(),
});
