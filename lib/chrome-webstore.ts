/**
 * Chrome Web Store listing URL for one-click “Add to Chrome”.
 * Set NEXT_PUBLIC_CHROME_WEBSTORE_URL after the item exists in the developer dashboard.
 */
export const EXTENSION_ZIP_HREF = '/downloads/jobbeagle-extension.zip';


export function getChromeWebStoreUrl(
  raw: string | undefined = process.env.NEXT_PUBLIC_CHROME_WEBSTORE_URL,
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
