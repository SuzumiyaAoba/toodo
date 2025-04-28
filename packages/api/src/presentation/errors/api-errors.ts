/**
 * ErrorCode defines all possible error codes in the application
 */
export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Resource related errors
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // Permission and access related errors
  FORBIDDEN = "FORBIDDEN",

  // State transition related errors
  INVALID_STATE = "INVALID_STATE",
}

/**
 * APIError defines the standard error format for API responses
 */
export interface ApiError {
  code: ErrorCode;
  message: string;
}

/**
 * Create a standardized API error object
 *
 * @param code - Error code
 * @param message - Error message
 * @returns API error object
 */
export function createApiError(code: ErrorCode, message: string): ApiError {
  return { code, message };
}
