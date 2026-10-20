import 'reflect-metadata';

import { validateEnv } from './env.js';

const base = {
  DATABASE_URL: 'postgresql://estate:estate@localhost:5432/estate',
  JWT_SECRET: 'test-jwt-secret-estate',
};

describe('validateEnv', () => {
  it('defaults SWAGGER_ENABLED to true', () => {
    expect(validateEnv(base).SWAGGER_ENABLED).toBe(true);
  });

  it('reads the string false as false', () => {
    expect(
      validateEnv({ ...base, SWAGGER_ENABLED: 'false' }).SWAGGER_ENABLED,
    ).toBe(false);
    expect(validateEnv({ ...base, SWAGGER_ENABLED: '0' }).SWAGGER_ENABLED).toBe(
      false,
    );
  });

  it('reads the string true as true', () => {
    expect(
      validateEnv({ ...base, SWAGGER_ENABLED: 'true' }).SWAGGER_ENABLED,
    ).toBe(true);
    expect(validateEnv({ ...base, SWAGGER_ENABLED: '1' }).SWAGGER_ENABLED).toBe(
      true,
    );
  });

  it('rejects a swagger flag that is not true or false', () => {
    expect(() => validateEnv({ ...base, SWAGGER_ENABLED: 'maybe' })).toThrow(
      /SWAGGER_ENABLED/,
    );
  });
});
