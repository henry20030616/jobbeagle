import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { SECURITY_TEST_FILES } from './constants/security-tests';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: [...SECURITY_TEST_FILES],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/.next/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
