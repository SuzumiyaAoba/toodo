/**
 * ErrorCode defines all possible error codes in the application
 */
export enum ErrorCode {
  // 汎用エラー
  INTERNAL_ERROR = "INTERNAL_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // リソース関連エラー
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",

  // 権限・アクセス関連エラー
  FORBIDDEN = "FORBIDDEN",

  // 状態遷移関連エラー
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
