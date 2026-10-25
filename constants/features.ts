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
 * Restored 2026-10-25 so the /shorts entry is visible from the homepage.
 */
export function isHomepageShortsBannerEnabled(): boolean {
  return true;
}
