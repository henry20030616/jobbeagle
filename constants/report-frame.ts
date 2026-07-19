/**
 * Match BrandLogo `size="inline"` on /report (text-xl).
 * Back to Home / New Analysis / sample chrome use this scale.
 */
export const REPORT_ACTION_TEXT = 'text-xl font-bold tracking-tight';

/** Shared icon size inside report action controls */
export const REPORT_ACTION_ICON = 'w-5 h-5 shrink-0';

/** Action buttons — same text size as report-page Jobbeagle wordmark */
export const REPORT_ACTION_BTN =
  `inline-flex items-center gap-2 rounded-lg border border-slate-400 bg-slate-900/80 px-3 py-1.5 ${REPORT_ACTION_TEXT} text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors`;

/** Compact “View sample” chip — same text-xl scale as Jobbeagle / REPORT_ACTION */
export const SAMPLE_LINK_BTN =
  `inline-flex w-fit items-center gap-1 rounded-lg border border-indigo-400/50 bg-indigo-500/15 px-2.5 py-1 ${REPORT_ACTION_TEXT} text-indigo-200 hover:bg-indigo-500/25 hover:border-indigo-300 transition-colors`;

/**
 * Samples left-rail — ONE size for SAMPLE notice / Snapshot / Guide / Compare.
 * Keep in sync across all four boxes.
 */
export const SAMPLE_RAIL_TEXT = 'text-sm font-bold leading-snug tracking-tight';
export const SAMPLE_RAIL_ICON = 'w-4 h-4 shrink-0';
export const SAMPLE_HEADER_TEXT = SAMPLE_RAIL_TEXT;
export const SAMPLE_HEADER_ICON = SAMPLE_RAIL_ICON;
/** Base shell only — active/inactive border style set by caller (solid vs dashed) */
export const SAMPLE_HEADER_BTN =
  `inline-flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 ${SAMPLE_RAIL_TEXT} transition-colors shrink-0`;

/**
 * Snapshot / Guide large frames — same thickness (border-2), clear blue (not white).
 */
export const REPORT_FRAME_BORDER = 'border-2 border-blue-500';

/** Sample notice — thin light-grey frame, bright blue fill */
export const SAMPLE_NOTICE_SURFACE =
  'rounded-lg border border-slate-400 bg-sky-500';

export const REPORT_SLIDE_SURFACE = `rounded-2xl ${REPORT_FRAME_BORDER} bg-slate-950`;

/**
 * Shared Snapshot / Guide shell width.
 * Use viewport width only — do NOT cap with rem (e.g. 100rem ≈ 1600px),
 * or large monitors show a centered “island” with huge empty margins.
 */
export const REPORT_SHELL_WIDTH = 'w-full max-w-full';

/**
 * Fixed presentation canvas width (px). ReportFitStage lays out at this width,
 * then scales uniformly to fill the stage width — proportions stay fixed.
 * Wider canvas = less empty side margin on desktop monitors.
 */
export const REPORT_SLIDE_DESIGN_WIDTH = 1680;
