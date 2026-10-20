import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import {
  ApiErrorEnvelope,
  PageMeta,
  PaginatedEnvelope,
  SuccessEnvelope,
} from './models.dto.js';

type EnvelopeOptions = {
  paginated?: boolean;
  array?: boolean;
  status?: 200 | 201;
};

function itemSchema(model: Type<unknown> | 'string') {
  if (model === 'string') return { type: 'string' as const };
  return { $ref: getSchemaPath(model) };
}

function dataSchema(
  model: Type<unknown> | 'string',
  options?: EnvelopeOptions,
) {
  const item = itemSchema(model);
  if (options?.paginated || options?.array) {
    return { type: 'array' as const, items: item };
  }
  return item;
}

export function ApiEnvelope(
  model: Type<unknown> | 'string',
  options?: EnvelopeOptions,
) {
  const paginated = options?.paginated === true;
  const envelope = paginated ? PaginatedEnvelope : SuccessEnvelope;
  const extras: Type<unknown>[] = [envelope, PageMeta];
  if (model !== 'string') extras.push(model);
  const data = dataSchema(model, options);
  const status = options?.status ?? 200;
  if (paginated) {
    return applyDecorators(
      ApiExtraModels(...extras),
      ApiResponse({
        status,
        description: 'Paginated envelope of data and meta.',
        schema: {
          allOf: [
            { $ref: getSchemaPath(envelope) },
            {
              type: 'object',
              required: ['data', 'meta'],
              properties: { data, meta: { $ref: getSchemaPath(PageMeta) } },
            },
          ],
        },
      }),
    );
  }
  return applyDecorators(
    ApiExtraModels(...extras),
    ApiResponse({
      status,
      description: 'Envelope of data.',
      schema: {
        allOf: [
          { $ref: getSchemaPath(envelope) },
          { type: 'object', required: ['data'], properties: { data } },
        ],
      },
    }),
  );
}

const errorRef = { $ref: getSchemaPath(ApiErrorEnvelope) };

export function ApiErrorResponses() {
  return applyDecorators(
    ApiExtraModels(ApiErrorEnvelope),
    ApiBadRequestResponse({
      description:
        'Validation failed. error.fields maps each property to one sentence.',
      schema: {
        allOf: [
          errorRef,
          {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                required: ['statusCode', 'code', 'message', 'fields'],
                properties: {
                  fields: {
                    type: 'object',
                    additionalProperties: { type: 'string' },
                  },
                },
              },
            },
          },
        ],
      },
    }),
    ApiUnauthorizedResponse({
      description:
        'The bearer token is missing or invalid, or the email and password do not match.',
      schema: errorRef,
    }),
    ApiForbiddenResponse({
      description: 'The signed-in role cannot do this.',
      schema: errorRef,
    }),
    ApiNotFoundResponse({
      description: 'That record was not found.',
      schema: errorRef,
    }),
    ApiConflictResponse({
      description: 'That record already exists.',
      schema: errorRef,
    }),
    ApiTooManyRequestsResponse({
      description: 'Too many requests.',
      schema: errorRef,
    }),
  );
}
