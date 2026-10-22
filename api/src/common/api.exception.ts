import { HttpException } from '@nestjs/common';

import type { ErrorCode } from './contracts.js';

export class ApiException extends HttpException {
  constructor(status: number, code: ErrorCode, message: string, fields?: Record<string, string>) {
    const body: { statusCode: number; code: ErrorCode; message: string; fields?: Record<string, string> } =
      {
        statusCode: status,
        code,
        message,
      };
    if (fields && Object.keys(fields).length > 0) body.fields = fields;
    super(body, status);
  }
}

export function unauthorized(message = 'Sign in to continue.'): ApiException {
  return new ApiException(401, 'UNAUTHORIZED', message);
}

export function forbidden(message: string): ApiException {
  return new ApiException(403, 'FORBIDDEN', message);
}

export function notFound(message: string): ApiException {
  return new ApiException(404, 'NOT_FOUND', message);
}

export function conflict(message: string): ApiException {
  return new ApiException(409, 'CONFLICT', message);
}

export function badRequest(message: string, fields?: Record<string, string>): ApiException {
  return new ApiException(400, 'BAD_REQUEST', message, fields);
}

export function tooMany(message: string): ApiException {
  return new ApiException(429, 'TOO_MANY_REQUESTS', message);
}
