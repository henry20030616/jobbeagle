import { describe, expect, it } from 'vitest';
import {
  EXTENSION_ZIP_HREF,
  PUBLISHED_CHROME_WEBSTORE_URL,
  getChromeWebStoreUrl,
} from '@/lib/chrome-webstore';

describe('getChromeWebStoreUrl', () => {
  it('falls back to the published listing when unset', () => {
    expect(getChromeWebStoreUrl(undefined)).toBe(PUBLISHED_CHROME_WEBSTORE_URL);
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

  it('exposes a same-origin zip path for download before the store listing is live', () => {
    expect(EXTENSION_ZIP_HREF).toBe('/downloads/jobbeagle-extension.zip');
  });
});
