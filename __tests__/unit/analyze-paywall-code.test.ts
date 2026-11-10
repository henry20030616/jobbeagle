import { describe, it, expect } from 'vitest';
import { isAnalyzePaywallCode } from '@/lib/analyze-client';

describe('isAnalyzePaywallCode', () => {
  it('recognizes login / guest / quota codes', () => {
    expect(isAnalyzePaywallCode('AUTH_REQUIRED')).toBe(true);
    expect(isAnalyzePaywallCode('PAYMENT_REQUIRED')).toBe(true);
    expect(isAnalyzePaywallCode('GUEST_FIT_USED')).toBe(true);
    expect(isAnalyzePaywallCode('GUEST_DEVICE_REQUIRED')).toBe(true);
  });

  it('rejects unrelated codes', () => {
    expect(isAnalyzePaywallCode('RATE_LIMIT')).toBe(false);
    expect(isAnalyzePaywallCode('JD_MISSING_COMPANY')).toBe(false);
    expect(isAnalyzePaywallCode(null)).toBe(false);
  });
});
