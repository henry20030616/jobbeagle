/**
 * Unified viewport scaling — fixed design canvas + CSS zoom.
 * Homepage (/) is frozen and does NOT use this layer.
 */

/** Document / utility pages (extension, account, legal, confirm). */
export const DOC_DESIGN_WIDTH = 1440;

/** Shorts phone canvas (iPhone logical size). */
export const SHORTS_DESIGN_WIDTH = 430;
export const SHORTS_DESIGN_HEIGHT = 932;

/** Sheet height inside Shorts canvas (~85% of 932). */
export const SHORTS_SHEET_HEIGHT = 790;

/** CSS custom property written by FitStage for portaled overlays. */
export const FIT_ZOOM_CSS_VAR = '--jb-fit-zoom';
