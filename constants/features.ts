/** Product feature flags */

/**
 * Shorts / employer video recruiting surface.
 * Enabled by default. Set NEXT_PUBLIC_SHORTS_ENABLED=false to freeze.
 */
export function isShortsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHORTS_ENABLED !== 'false';
}

/**
 * Homepage "Explore Job Shorts" promo banner.
 * Temporarily hidden (2026-07) so the analyze funnel stays primary.
 * When you resume detailed Shorts development, set this to `true`
 * (or env-gate it) and confirm the banner on `app/page.tsx` is visible again.
 */
export function isHomepageShortsBannerEnabled(): boolean {
  return false;
}
