import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const nextConfig = require('../../next.config.js') as {
  headers: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>>;
};

describe('HTTP security headers', () => {
  it('sets nosniff, referrer policy, and frame-ancestors for the site', async () => {
    const entries = await nextConfig.headers();
    const all = entries.flatMap((entry: { source: string; headers: Array<{ key: string; value: string }> }) =>
      entry.headers.map((h) => ({ source: entry.source, ...h })),
    );

    expect(
      all.some((h) => h.key === 'X-Content-Type-Options' && h.value === 'nosniff'),
    ).toBe(true);
    expect(
      all.some((h) => h.key === 'Referrer-Policy' && h.value === 'strict-origin-when-cross-origin'),
    ).toBe(true);
    expect(
      all.some(
        (h) =>
          h.source === '/confirm'
          && h.key === 'Content-Security-Policy'
          && h.value.includes('chrome-extension:'),
      ),
    ).toBe(true);
  });
});
