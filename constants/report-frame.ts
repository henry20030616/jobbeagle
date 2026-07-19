/** Shared label size — Back to Home / Jobbeagle / sample tabs / compare */
export const REPORT_ACTION_TEXT = 'text-lg font-semibold';

/** Shared icon size inside report action controls */
export const REPORT_ACTION_ICON = 'w-5 h-5 shrink-0';

/** Action buttons — thin light-grey frame; side-by-side in sample column */
export const REPORT_ACTION_BTN =
  `inline-flex items-center gap-2 rounded-lg border border-slate-400 bg-slate-900/80 px-3.5 py-2.5 ${REPORT_ACTION_TEXT} text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors`;

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
