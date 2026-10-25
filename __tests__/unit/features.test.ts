import { afterEach, describe, expect, it } from 'vitest';
import {
  isHomepageShortsBannerEnabled,
  isShortsEnabled,
} from '@/constants/features';

describe('shorts feature flags', () => {
  const original = process.env.NEXT_PUBLIC_SHORTS_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_SHORTS_ENABLED;
    } else {
      process.env.NEXT_PUBLIC_SHORTS_ENABLED = original;
    }
  });

  it('enables Shorts unless NEXT_PUBLIC_SHORTS_ENABLED is false', () => {
    delete process.env.NEXT_PUBLIC_SHORTS_ENABLED;
    expect(isShortsEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_SHORTS_ENABLED = 'true';
    expect(isShortsEnabled()).toBe(true);

    process.env.NEXT_PUBLIC_SHORTS_ENABLED = 'false';
    expect(isShortsEnabled()).toBe(false);
  });

  it('hides the homepage Explore Job Shorts banner', () => {
    expect(isHomepageShortsBannerEnabled()).toBe(false);
  });
});
