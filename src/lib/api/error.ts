export const UNREACHABLE_MESSAGE = "We couldn't reach the server. Try again in a moment.";

export type ApiMeta = {
  total: number;
  page: number;
  pageSize: number;
};

export type ApiSuccess<T> = {
  data: T;
  meta?: ApiMeta;
};

export type ApiErrorBody = {
  statusCode: number;
  code: string;
  message: string;
  fields?: Record<string, string>;
};

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly fields?: Record<string, string>;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.statusCode = body.statusCode;
    this.code = body.code;
    if (body.fields) this.fields = body.fields;
  }

  static unreachable(): ApiError {
    return new ApiError({ statusCode: 0, code: "NETWORK", message: UNREACHABLE_MESSAGE });
  }
}
