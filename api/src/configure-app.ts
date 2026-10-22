import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { uploadsDir } from './common/uploads.js';
import { validationExceptionFactory } from './common/validation.js';
import { setupSwagger } from './openapi/setup.js';

const crossOrigin = {
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
};
const apiHelmet = helmet(crossOrigin);
const docsHelmet = helmet({
  ...crossOrigin,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
    },
  },
});

function isDocsPath(path: string): boolean {
  return path === '/api/docs' || path.startsWith('/api/docs/');
}

export function configureApp(app: INestApplication): void {
  const express = app as NestExpressApplication;
  const config = app.get(ConfigService);
  if (process.env.NODE_ENV === 'production' || process.env.RENDER === 'true') {
    express.set('trust proxy', 1);
  }
  express.use((req: Request, res: Response, next: NextFunction) => {
    if (isDocsPath(req.path)) {
      docsHelmet(req, res, next);
      return;
    }
    apiHelmet(req, res, next);
  });
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
  if (config.getOrThrow<boolean>('SWAGGER_ENABLED')) setupSwagger(app);
}
