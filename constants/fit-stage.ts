/**
 * Unified viewport scaling — fixed design canvas + CSS zoom.
 * Homepage (/) is frozen and does NOT use this layer.
 */

/** Document / utility pages (extension, account, legal, confirm). */
export const DOC_DESIGN_WIDTH = 1440;

/**
 * Shorts design reference for sheet portals (not the stage size).
 * Stage uses FitStage mode="fill" (full-bleed). Sheets still lay out at this
 * width and zoom via --jb-fit-zoom so they stay readable on desktop.
 */
export const SHORTS_DESIGN_WIDTH = 430;
/** @deprecated Kept for sheet height; stage no longer uses a fixed phone canvas. */
export const SHORTS_DESIGN_HEIGHT = Math.round((SHORTS_DESIGN_WIDTH * 16) / 9); // 764

/** Sheet height inside Shorts (~85% of former phone canvas height). */
export const SHORTS_SHEET_HEIGHT = Math.round(SHORTS_DESIGN_HEIGHT * 0.85);

/** CSS custom property written by FitStage for portaled overlays. */
export const FIT_ZOOM_CSS_VAR = '--jb-fit-zoom';
