/** Action buttons — thin light-grey frame; side-by-side in sample column */
export const REPORT_ACTION_BTN =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-400 bg-slate-900/80 px-2.5 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800 hover:border-slate-300 transition-colors';

/**
 * Snapshot / Guide large frames — same thickness (border-2), clear blue (not white).
 */
export const REPORT_FRAME_BORDER = 'border-2 border-blue-500';

/** Sample notice — thin light-grey frame, bright blue fill */
export const SAMPLE_NOTICE_SURFACE =
  'rounded-lg border border-slate-400 bg-sky-500';

export const REPORT_SLIDE_SURFACE = `rounded-2xl ${REPORT_FRAME_BORDER} bg-slate-950`;

/** Shared max width so Snapshot and Guide report shells match */
export const REPORT_SHELL_WIDTH = 'max-w-7xl';
