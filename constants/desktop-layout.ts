/**
 * Desktop vs phone layout gate.
 *
 * Phone landscape often reports CSS width ≥ Tailwind `lg` (1024px) while
 * height stays ~350–450px. Treating that as desktop swaps in the 4-col form
 * and the huge homepage/account type scale — layout looks “broken” after rotate.
 *
 * Require both min width and min height before enabling desktop chrome.
 */
export const DESKTOP_LAYOUT_MIN_WIDTH = 1024;
export const DESKTOP_LAYOUT_MIN_HEIGHT = 700;
/** Short-viewport ceiling used for “phone landscape” guards (just below min height). */
export const DESKTOP_LAYOUT_MAX_SHORT_HEIGHT = DESKTOP_LAYOUT_MIN_HEIGHT - 1;

export const DESKTOP_LAYOUT_MEDIA =
  `(min-width: ${DESKTOP_LAYOUT_MIN_WIDTH}px) and (min-height: ${DESKTOP_LAYOUT_MIN_HEIGHT}px)` as const;

export function isDesktopLayoutViewport(width: number, height: number): boolean {
  return width >= DESKTOP_LAYOUT_MIN_WIDTH && height >= DESKTOP_LAYOUT_MIN_HEIGHT;
}
