import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';

/**
 * 這些是從 analyze/route.ts 提取的純邏輯函式，
 * 用於驗證 rate-limit hash 行為的一致性與正確性。
 */

function hashIP(ip: string): string {
  return createHash('sha256').update(ip + 'jb_rl_salt').digest('hex').substring(0, 24);
}

function getGuestKey(ip: string): string {
  return hashIP(ip);
}

function getUserKey(userId: string): string {
  return hashIP(`user_${userId}`);
}

// ──────────────────────────────────────────────
// hash 函式行為
// ──────────────────────────────────────────────
describe('rate-limit key hashing', () => {
  it('returns 24-char hex string', () => {
    const key = hashIP('1.2.3.4');
    expect(key).toHaveLength(24);
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it('is deterministic — same input, same output', () => {
    expect(hashIP('1.2.3.4')).toBe(hashIP('1.2.3.4'));
  });

  it('produces different hashes for different IPs', () => {
    expect(hashIP('1.2.3.4')).not.toBe(hashIP('5.6.7.8'));
  });

  it('guest key and user key are always different (no collision)', () => {
    // Even if userId === IP, the keys should differ due to "user_" prefix
    const ip = '1.2.3.4';
    const userId = '1.2.3.4';
    expect(getGuestKey(ip)).not.toBe(getUserKey(userId));
  });

  it('two different users produce different keys', () => {
    const key1 = getUserKey('user-uuid-aaa');
    const key2 = getUserKey('user-uuid-bbb');
    expect(key1).not.toBe(key2);
  });
});

// ──────────────────────────────────────────────
// daily limit values
// ──────────────────────────────────────────────
describe('daily limits', () => {
  const GUEST_DAILY_LIMIT = 2;
  const USER_DAILY_LIMIT = 2;

  it('guest limit is 2', () => {
    expect(GUEST_DAILY_LIMIT).toBe(2);
  });

  it('logged-in user limit is 2 (PLG tier)', () => {
    expect(USER_DAILY_LIMIT).toBe(2);
  });

  it('guest and user share the same daily free quota', () => {
    expect(USER_DAILY_LIMIT).toBe(GUEST_DAILY_LIMIT);
  });

  it('usage is allowed when count < limit', () => {
    const allowed = (count: number, limit: number) => count < limit;
    expect(allowed(0, GUEST_DAILY_LIMIT)).toBe(true);
    expect(allowed(1, GUEST_DAILY_LIMIT)).toBe(true);
    expect(allowed(2, GUEST_DAILY_LIMIT)).toBe(false);
    expect(allowed(1, USER_DAILY_LIMIT)).toBe(true);
    expect(allowed(2, USER_DAILY_LIMIT)).toBe(false);
  });
});

// ──────────────────────────────────────────────
// getClientIP helper behaviour
// ──────────────────────────────────────────────
describe('getClientIP extraction logic', () => {
  function getClientIP(headers: Record<string, string | null>): string {
    const forwarded = headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return headers['x-real-ip'] ?? 'unknown';
  }

  it('takes first IP from x-forwarded-for (multi-proxy)', () => {
    expect(getClientIP({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1, 192.168.1.1', 'x-real-ip': null }))
      .toBe('1.2.3.4');
  });

  it('trims spaces from forwarded-for value', () => {
    expect(getClientIP({ 'x-forwarded-for': '  5.6.7.8  ', 'x-real-ip': null }))
      .toBe('5.6.7.8');
  });

  it('falls back to x-real-ip when no x-forwarded-for', () => {
    expect(getClientIP({ 'x-forwarded-for': null, 'x-real-ip': '9.10.11.12' }))
      .toBe('9.10.11.12');
  });

  it('returns "unknown" when no IP headers present', () => {
    expect(getClientIP({ 'x-forwarded-for': null, 'x-real-ip': null }))
      .toBe('unknown');
  });
});
