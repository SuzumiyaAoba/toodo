import { object, string } from "valibot";

/**
 * Schema for UUID validation
 */
export const IdParamSchema = object({
  id: string(),
});
