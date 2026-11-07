import { describe, expect, it } from 'vitest';
import { buildAuthCallbackUrl, isValidSignInEmail } from '@/lib/auth-redirect';

describe('isValidSignInEmail', () => {
  it('accepts normal emails', () => {
    expect(isValidSignInEmail('ada@jobbeagle.com')).toBe(true);
    expect(isValidSignInEmail('  ada@jobbeagle.com ')).toBe(true);
  });

  it('rejects garbage', () => {
    expect(isValidSignInEmail('')).toBe(false);
    expect(isValidSignInEmail('not-an-email')).toBe(false);
    expect(isValidSignInEmail('@x.com')).toBe(false);
  });
});

describe('buildAuthCallbackUrl', () => {
  it('includes redirect and referral when provided', () => {
    const url = buildAuthCallbackUrl({
      origin: 'https://www.jobbeagle.com',
      redirectTo: '/account',
      referralCode: 'ABC',
    });
    expect(url).toContain('https://www.jobbeagle.com/auth/callback');
    expect(url).toContain('redirect=%2Faccount');
    expect(url).toContain('ref=ABC');
  });
});
