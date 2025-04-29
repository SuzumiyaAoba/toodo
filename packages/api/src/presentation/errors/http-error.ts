/**
 * HTTP エラークラス
 */
export class HttpError extends Error {
  constructor(
    public message: string,
    public status = 500,
  ) {
    super(message);
    this.name = "HttpError";
  }
}
