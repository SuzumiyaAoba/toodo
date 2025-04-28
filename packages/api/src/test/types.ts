import type { mock } from "bun:test";

/**
 * Extended type definition for mock functions
 * T: Type of the function to be mocked
 *
 * Type that combines Bun's mock function methods and the original function's capabilities
 */
export type MockedFunction<T> = {
  [K in keyof ReturnType<typeof mock>]: ReturnType<typeof mock>[K];
} & T;
