import { describe, it, expect, beforeEach } from 'vitest';
import {
  rateLimit,
  __resetMemoryRateLimitForTests,
} from '@/lib/rate-limit';

describe('memory rate limit fallback', () => {
  beforeEach(() => {
    __resetMemoryRateLimitForTests();
  });

  it('allows requests under the limit', async () => {
    const a = await rateLimit('test', 'user-a', 3, 60);
    const b = await rateLimit('test', 'user-a', 3, 60);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });

  it('blocks when limit exceeded', async () => {
    await rateLimit('test', 'user-b', 2, 60);
    await rateLimit('test', 'user-b', 2, 60);
    const blocked = await rateLimit('test', 'user-b', 2, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('isolates keys', async () => {
    await rateLimit('test', 'u1', 1, 60);
    const other = await rateLimit('test', 'u2', 1, 60);
    expect(other.allowed).toBe(true);
  });
});
