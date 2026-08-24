/**
 * Unified viewport scaling — fixed design canvas + CSS zoom.
 * Homepage (/) is frozen and does NOT use this layer.
 */

/** Document / utility pages (extension, account, legal, confirm). */
export const DOC_DESIGN_WIDTH = 1440;

/**
 * Shorts phone canvas — true 9:16 (not taller-than-phone 430×932).
 * Visual column width after zoom = min(availW, availH × 9/16), so desktop
 * fills viewport height with a proper portrait stage (not a skinny seam).
 */
export const SHORTS_DESIGN_WIDTH = 430;
export const SHORTS_DESIGN_HEIGHT = Math.round((SHORTS_DESIGN_WIDTH * 16) / 9); // 764

/** Sheet height inside Shorts canvas (~85% of design height). */
export const SHORTS_SHEET_HEIGHT = Math.round(SHORTS_DESIGN_HEIGHT * 0.85);

/** CSS custom property written by FitStage for portaled overlays. */
export const FIT_ZOOM_CSS_VAR = '--jb-fit-zoom';
