import { plainToInstance, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

function swaggerEnabled(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return true;
  if (value === true || value === false) return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return value;
}

class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @MinLength(16, { message: 'JWT_SECRET must be at least 16 characters.' })
  JWT_SECRET!: string;

  @IsString()
  @MinLength(1)
  JWT_EXPIRES_IN = '7d';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsString()
  CORS_ORIGIN = 'http://localhost:3000';

  @IsString()
  PUBLIC_API_ORIGIN = 'http://localhost:4000';

  @IsBoolean()
  SWAGGER_ENABLED = true;
}

export type AppEnv = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  PORT: number;
  CORS_ORIGIN: string;
  PUBLIC_API_ORIGIN: string;
  SWAGGER_ENABLED: boolean;
};

export function validateEnv(config: Record<string, unknown>): AppEnv {
  const candidate = {
    ...config,
    JWT_EXPIRES_IN: config.JWT_EXPIRES_IN || '7d',
    PORT: config.PORT || 4000,
    CORS_ORIGIN: config.CORS_ORIGIN || 'http://localhost:3000',
    PUBLIC_API_ORIGIN: config.PUBLIC_API_ORIGIN || 'http://localhost:4000',
    SWAGGER_ENABLED: swaggerEnabled(config.SWAGGER_ENABLED),
  };
  const validated = plainToInstance(EnvironmentVariables, candidate, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map(
        (error) =>
          `${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`,
      )
      .join('; ');
    throw new Error(`Invalid environment. ${details}`);
  }
  return {
    DATABASE_URL: validated.DATABASE_URL,
    JWT_SECRET: validated.JWT_SECRET,
    JWT_EXPIRES_IN: validated.JWT_EXPIRES_IN,
    PORT: validated.PORT,
    CORS_ORIGIN: validated.CORS_ORIGIN.replace(/\/$/, ''),
    PUBLIC_API_ORIGIN: validated.PUBLIC_API_ORIGIN.replace(/\/$/, ''),
    SWAGGER_ENABLED: validated.SWAGGER_ENABLED,
  };
}
