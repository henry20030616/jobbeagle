/**
 * Page chrome (outside ReportFitStage zoom). Sized to stay readable
 * next to a zoomed Snapshot/Guide slide — not compact header chips.
 */
export const REPORT_ACTION_TEXT = 'text-6xl font-bold tracking-tight leading-none';

export const REPORT_ACTION_ICON = 'w-16 h-16 shrink-0';

/** Back to Home / New Analysis / language chrome */
export const REPORT_ACTION_BTN =
  `inline-flex min-h-28 items-center gap-4 rounded-xl border-2 border-slate-400 bg-slate-900/70 px-8 py-5 ${REPORT_ACTION_TEXT} text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors`;

/**
 * “View sample” chip on the homepage report-type cards.
 * Size with em so padding tracks homepage-font-large (rem padding stayed tiny).
 * text-2xl matches the card blurb / Saved Resumes pill; max-w-full keeps the grid from shoving.
 */
export const SAMPLE_LINK_BTN =
  `inline-flex w-fit max-w-full items-center gap-[0.4em] rounded-xl border-2 border-indigo-400/50 bg-indigo-500/15 px-[0.9em] py-[0.45em] text-2xl font-bold leading-snug text-indigo-200 underline underline-offset-[0.18em] hover:bg-indigo-500/25 hover:border-indigo-300 transition-colors`;

/**
 * Samples left-rail — ONE size for SAMPLE notice / Snapshot / Guide / Compare.
 * Keep in sync across all four boxes.
 */
export const SAMPLE_RAIL_TEXT = 'text-6xl font-bold leading-snug tracking-tight';
export const SAMPLE_RAIL_ICON = 'w-16 h-16 shrink-0';
export const SAMPLE_HEADER_TEXT = SAMPLE_RAIL_TEXT;
export const SAMPLE_HEADER_ICON = SAMPLE_RAIL_ICON;
/** Base shell only — active/inactive border style set by caller (solid vs dashed) */
export const SAMPLE_HEADER_BTN =
  `inline-flex items-center justify-center gap-5 rounded-xl border-2 px-8 py-6 ${SAMPLE_RAIL_TEXT} transition-colors shrink-0`;

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
