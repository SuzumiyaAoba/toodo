import { number, object, optional } from "valibot";

export const DependencyTreeQuerySchema = object({
  maxDepth: optional(number()),
});

export type DependencyTreeQuery = {
  maxDepth?: number;
};
