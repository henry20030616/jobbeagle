import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    environmentMatchGlobs: [
      ['__tests__/unit/shorts-view-role.test.ts', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
