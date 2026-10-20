import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const DESCRIPTION = [
  'Listings, accounts, inquiries, and favorites for 4OUR Estate.',
  '',
  'Roles are buyer, agent, and admin. Signup accepts buyer or agent. An admin assigns the admin role later.',
  '',
  'A success body is { data }. A paginated list is { data, meta } where meta has total, page, and pageSize.',
  'An error body is { error } where error has statusCode, code, message, and sometimes fields.',
  '',
  'Authorize with the accessToken from POST /auth/login.',
].join('\n');

function apiVersion(): string {
  const packagePath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    '..',
    'package.json',
  );
  const raw: unknown = JSON.parse(readFileSync(packagePath, 'utf8'));
  if (
    typeof raw !== 'object' ||
    raw === null ||
    !('version' in raw) ||
    typeof raw.version !== 'string'
  ) {
    throw new Error('api/package.json is missing a version string.');
  }
  return raw.version;
}

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('4OUR Estate API')
    .setDescription(DESCRIPTION)
    .setVersion(apiVersion())
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the accessToken from POST /auth/login.',
      },
      'bearer',
    )
    .build();
  // nest-cli.json gives the Swagger plugin a controller suffix that no file uses.
  // The plugin would otherwise describe the raw return value. The interceptor wraps that value.
  const document = () =>
    SwaggerModule.createDocument(app, config, {
      autoTagControllers: false,
    });
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: '4OUR Estate API',
  });
}
