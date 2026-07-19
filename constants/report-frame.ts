/** Shared label size — Back to Home / Jobbeagle / sample tabs / compare */
export const REPORT_ACTION_TEXT = 'text-xl font-semibold';

/** Shared icon size inside report action controls */
export const REPORT_ACTION_ICON = 'w-6 h-6 shrink-0';

/** Action buttons — thin light-grey frame; side-by-side in sample column */
export const REPORT_ACTION_BTN =
  `inline-flex items-center gap-2.5 rounded-lg border border-slate-400 bg-slate-900/80 px-4 py-3 ${REPORT_ACTION_TEXT} text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors`;

/**
 * Samples page chrome — match BrandLogo `size="nav"`
 * (text-2xl sm:text-3xl font-black + icon ~3–3.5rem tall).
 */
export const SAMPLE_HEADER_TEXT = 'text-2xl sm:text-3xl font-black tracking-tight';
export const SAMPLE_HEADER_ICON = 'w-7 h-7 sm:w-8 sm:h-8 shrink-0';
export const SAMPLE_HEADER_BTN =
  `inline-flex items-center gap-2.5 sm:gap-3 rounded-xl border-2 px-5 py-2.5 sm:px-6 sm:py-3 min-h-[3.25rem] sm:min-h-[3.5rem] ${SAMPLE_HEADER_TEXT} transition-colors`;

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
export const REPORT_SHELL_WIDTH = 'w-full max-w-[98vw]';

/**
 * Fixed presentation canvas width (px). ReportFitStage lays out at this width,
 * then scales uniformly to fill the stage width — proportions stay fixed.
 */
export const REPORT_SLIDE_DESIGN_WIDTH = 1280;

/** Homepage operator canvas — same uniform-scale approach as reports. */
export const HOME_DESIGN_WIDTH = 1440;
