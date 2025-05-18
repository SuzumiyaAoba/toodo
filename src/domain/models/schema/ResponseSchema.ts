import { z } from "zod";

// Error response schema
export const errorResponseSchema = z.object({
	error: z.string(),
	details: z.record(z.string(), z.string()).optional(),
});

// Generic success response schema
export const successResponseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
});

// Task deletion success response schema
export const deleteTaskResponseSchema = successResponseSchema;

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type SuccessResponse = z.infer<typeof successResponseSchema>;
export type DeleteTaskResponse = z.infer<typeof deleteTaskResponseSchema>;
