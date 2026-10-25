/** Product feature flags */

/**
 * Shorts / employer video recruiting surface.
 * Enabled by default. Set NEXT_PUBLIC_SHORTS_ENABLED=false to freeze
 * (middleware then redirects /shorts, /employer, and /api/shorts home).
 */
export function isShortsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SHORTS_ENABLED !== 'false';
}

/**
 * Homepage "Explore Job Shorts" promo banner.
 * Hidden (2026-10-25) so the analyze funnel stays primary on jobbeagle.com.
 * Routes stay live via isShortsEnabled(); set this to `true` to restore the
 * homepage banner (and the matching footer Shorts link).
 */
export function isHomepageShortsBannerEnabled(): boolean {
  return false;
}
