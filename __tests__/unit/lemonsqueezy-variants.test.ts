import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  resolveLemonSqueezyVariant,
  getMissingLemonSqueezyVariants,
} from '@/lib/lemonsqueezy';

describe('Lemon Squeezy variant resolution', () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.LEMONSQUEEZY_VARIANT_BASIC_OVERAGE = '1869600';
    process.env.LEMONSQUEEZY_VARIANT_SINGLE_LITE = '';
    process.env.LEMONSQUEEZY_VARIANT_SINGLE_JOB_FIT_SNAPSHOT = '';
    process.env.LEMONSQUEEZY_VARIANT_SINGLE_FULL = '9999';
    process.env.LEMONSQUEEZY_VARIANT_SINGLE_INTERVIEW_STRATEGY_GUIDE = '';
    process.env.LEMONSQUEEZY_VARIANT_STANDARD_SUB = '8888';
    process.env.LEMONSQUEEZY_VARIANT_ADVANCED_SUB = '7777';
  });

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it('canonical snapshot plan falls back to BASIC_OVERAGE when unset', () => {
    expect(resolveLemonSqueezyVariant('single_job_fit_snapshot')).toBe('1869600');
  });

  it('legacy single_lite still resolves', () => {
    expect(resolveLemonSqueezyVariant('single_lite')).toBe('1869600');
  });

  it('prefers SINGLE_LITE when set', () => {
    process.env.LEMONSQUEEZY_VARIANT_SINGLE_LITE = '1111';
    expect(resolveLemonSqueezyVariant('single_job_fit_snapshot')).toBe('1111');
  });

  it('reports missing strategy guide variant', () => {
    delete process.env.LEMONSQUEEZY_VARIANT_SINGLE_FULL;
    const missing = getMissingLemonSqueezyVariants();
    expect(missing.some((m) => m.includes('SINGLE_FULL') || m.includes('INTERVIEW_STRATEGY'))).toBe(true);
  });
});
