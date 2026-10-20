import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

export function flattenErrors(errors: ValidationError[], parent = ''): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const error of errors) {
    const key = parent ? `${parent}.${error.property}` : error.property;
    const constraints = error.constraints ? Object.entries(error.constraints) : [];
    if (constraints.length > 0 && fields[key] === undefined) {
      const whitelist = constraints.find(([name]) => name === 'whitelistValidation');
      fields[key] = whitelist ? 'This field is not allowed.' : (constraints[0]?.[1] ?? 'Check this field.');
    }
    if (error.children && error.children.length > 0) {
      Object.assign(fields, flattenErrors(error.children, key));
    }
  }
  return fields;
}

export function validationExceptionFactory(errors: ValidationError[]): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    code: 'VALIDATION_FAILED',
    message: 'Check the highlighted fields.',
    fields: flattenErrors(errors),
  });
}
