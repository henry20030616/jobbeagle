import { describe, expect, it } from 'vitest';
import { getChromeWebStoreUrl } from '@/lib/chrome-webstore';

describe('getChromeWebStoreUrl', () => {
  it('returns null when unset', () => {
    expect(getChromeWebStoreUrl(undefined)).toBeNull();
    expect(getChromeWebStoreUrl('')).toBeNull();
    expect(getChromeWebStoreUrl('  ')).toBeNull();
  });

  it('accepts chromewebstore.google.com listing URLs', () => {
    const href = 'https://chromewebstore.google.com/detail/jobbeagle/abcdefghijklmnop';
    expect(getChromeWebStoreUrl(href)).toBe(href);
  });

  it('rejects non-store URLs', () => {
    expect(getChromeWebStoreUrl('https://github.com/henry20030616/jobbeagle')).toBeNull();
  });
});
