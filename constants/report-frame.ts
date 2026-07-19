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

/** Samples left-rail tabs — slightly compact; still readable */
export const SAMPLE_HEADER_TEXT = 'text-base sm:text-lg font-bold tracking-tight';
export const SAMPLE_HEADER_ICON = 'w-5 h-5 shrink-0';
export const SAMPLE_HEADER_BTN =
  `inline-flex items-center gap-2 rounded-lg border px-3 py-2 ${SAMPLE_HEADER_TEXT} transition-colors`;

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
 */
export const REPORT_SLIDE_DESIGN_WIDTH = 1280;

/** Homepage operator canvas — same uniform-scale approach as reports. */
export const HOME_DESIGN_WIDTH = 1440;
