import { describe, expect, it } from 'vitest';
import { buildAuthCallbackUrl } from '@/lib/auth-redirect';

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
