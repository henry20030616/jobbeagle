/**
 * Desktop vs phone layout gate.
 *
 * Phone landscape often reports CSS width ≥ Tailwind `lg` (1024px) while
 * height stays ~350–480px. Treating that as desktop swaps in the 4-col form
 * and the huge homepage/account type scale — layout looks “broken” after rotate.
 *
 * Require min width + a modest min height (still below typical laptop chrome
 * heights) before enabling desktop chrome. Phone landscape stays mobile.
 */
export const DESKTOP_LAYOUT_MIN_WIDTH = 1024;
/** Above phone-landscape heights (~430–480); below most laptop usable heights. */
export const DESKTOP_LAYOUT_MIN_HEIGHT = 560;
/** Short-viewport ceiling used for “phone landscape” guards (just below min height). */
export const DESKTOP_LAYOUT_MAX_SHORT_HEIGHT = DESKTOP_LAYOUT_MIN_HEIGHT - 1;

export const DESKTOP_LAYOUT_MEDIA =
  `(min-width: ${DESKTOP_LAYOUT_MIN_WIDTH}px) and (min-height: ${DESKTOP_LAYOUT_MIN_HEIGHT}px)` as const;

export function isDesktopLayoutViewport(width: number, height: number): boolean {
  return width >= DESKTOP_LAYOUT_MIN_WIDTH && height >= DESKTOP_LAYOUT_MIN_HEIGHT;
}
