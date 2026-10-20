import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { uploadsDir } from './common/uploads.js';
import { validationExceptionFactory } from './common/validation.js';

export function configureApp(app: INestApplication): void {
  const express = app as NestExpressApplication;
  const config = app.get(ConfigService);
  express.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  express.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN'),
    credentials: true,
  });
  express.setGlobalPrefix('api/v1');
  express.useStaticAssets(uploadsDir(), { prefix: '/uploads' });
  express.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
}
