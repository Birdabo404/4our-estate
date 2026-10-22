import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';

import { ApiException } from './api.exception.js';
import type { ErrorBody, ErrorCode } from './contracts.js';

type PrismaKnown = {
  code: string;
  clientVersion: string;
  meta?: { target?: unknown };
  message: string;
  stack?: string;
};

function isPrismaKnown(error: unknown): error is PrismaKnown {
  if (typeof error !== 'object' || error === null) return false;
  const row = error as Partial<PrismaKnown>;
  return typeof row.code === 'string' && row.code.startsWith('P') && typeof row.clientVersion === 'string';
}

function codeFor(status: number): ErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'TOO_MANY_REQUESTS';
    default:
      return status >= 500 ? 'INTERNAL' : 'BAD_REQUEST';
  }
}

function defaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Some of those details are not valid.';
    case 401:
      return 'Sign in to continue.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'That record was not found.';
    case 409:
      return 'That record already exists.';
    case 429:
      return 'Too many requests. Try again in a minute.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

function mapPrisma(error: PrismaKnown): ErrorBody {
  if (error.code === 'P2002') {
    const target = JSON.stringify(error.meta?.target ?? '');
    if (target.includes('email')) {
      return {
        statusCode: 409,
        code: 'CONFLICT',
        message: 'An account with this email already exists.',
      };
    }
    if (target.includes('slug')) {
      return {
        statusCode: 409,
        code: 'CONFLICT',
        message: 'A listing with this slug already exists.',
      };
    }
    return { statusCode: 409, code: 'CONFLICT', message: 'That record already exists.' };
  }
  if (error.code === 'P2025') {
    return { statusCode: 404, code: 'NOT_FOUND', message: 'That record was not found.' };
  }
  return { statusCode: 500, code: 'INTERNAL', message: 'Something went wrong. Please try again.' };
}

function messageFrom(raw: unknown): string | undefined {
  if (typeof raw === 'string') return raw;
  if (typeof raw !== 'object' || raw === null || !('message' in raw)) return undefined;
  const message = (raw as { message: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  return undefined;
}

function fromHttp(exception: HttpException): ErrorBody {
  const status = exception.getStatus();
  const raw = exception.getResponse();
  if (typeof raw === 'object' && raw !== null && 'code' in raw && typeof raw.code === 'string') {
    const body = raw as { code: ErrorCode; message?: string; fields?: Record<string, string> };
    const error: ErrorBody = {
      statusCode: status,
      code: body.code,
      message: body.message ?? defaultMessage(status),
    };
    if (body.fields && Object.keys(body.fields).length > 0) error.fields = body.fields;
    return error;
  }
  const message = status >= 500 ? defaultMessage(500) : (messageFrom(raw) ?? defaultMessage(status));
  return { statusCode: status, code: codeFor(status), message };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE') {
      response.status(400).json({
        error: {
          statusCode: 400,
          code: 'VALIDATION_FAILED',
          message: 'Check the highlighted fields.',
          fields: { file: 'Images must be 8 MB or smaller.' },
        },
      });
      return;
    }
    if (exception instanceof ApiException || exception instanceof HttpException) {
      const error = fromHttp(exception);
      if (error.statusCode >= 500) this.logger.error(exception.message, exception.stack);
      response.status(error.statusCode).json({ error });
      return;
    }
    if (isPrismaKnown(exception)) {
      this.logger.error(exception.message, exception.stack);
      const error = mapPrisma(exception);
      response.status(error.statusCode).json({ error });
      return;
    }
    const stack = exception instanceof Error ? exception.stack : undefined;
    const message = exception instanceof Error ? exception.message : 'unknown error';
    this.logger.error(message, stack);
    response.status(500).json({
      error: {
        statusCode: 500,
        code: 'INTERNAL',
        message: 'Something went wrong. Please try again.',
      },
    });
  }
}
