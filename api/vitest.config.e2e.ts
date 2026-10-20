import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    env: {
      DATABASE_URL: 'postgresql://estate:estate@localhost:5432/estate_test',
      JWT_SECRET: 'test-jwt-secret-estate',
      JWT_EXPIRES_IN: '1d',
      PORT: '4000',
      CORS_ORIGIN: 'http://localhost:3000',
      PUBLIC_API_ORIGIN: 'http://localhost:4000',
    },
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
