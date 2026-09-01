/**
 * Chrome Web Store listing (JobBeagle 1.3.2, public).
 * Override with NEXT_PUBLIC_CHROME_WEBSTORE_URL if the listing URL changes.
 */
export const EXTENSION_ZIP_HREF = '/downloads/jobbeagle-extension.zip';

export const PUBLISHED_CHROME_WEBSTORE_URL =
  'https://chromewebstore.google.com/detail/jobbeagle-headhunter-leve/pceknhembhfnljhpajkpdbihfbpfolpm';

export function getChromeWebStoreUrl(
  raw: string | undefined = process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL ?? PUBLISHED_CHROME_WEBSTORE_URL,
): string | null {
  const trimmed = raw?.trim() ?? '';
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (
      u.hostname === 'chromewebstore.google.com' ||
      u.hostname === 'chrome.google.com'
    ) {
      return u.href;
    }
  } catch {
    return null;
  }
  return null;
}
