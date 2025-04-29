export enum ErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  NOT_FOUND = "NOT_FOUND",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
}
