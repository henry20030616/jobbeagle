/** Shared report / sample chrome — bright blue frames (never near-white / grey) */
export const REPORT_FRAME_BORDER =
  'border-2 border-sky-400 shadow-[0_0_28px_-8px_rgba(56,189,248,0.55)]';

/** Sample notice: dark surface, same bright blue border as slides */
export const SAMPLE_NOTICE_SURFACE = `rounded-xl ${REPORT_FRAME_BORDER} bg-slate-900`;

/** Snapshot / Guide outer frame */
export const REPORT_SLIDE_SURFACE = `rounded-2xl ${REPORT_FRAME_BORDER} bg-slate-950`;

/** Shared action buttons above reports */
export const REPORT_ACTION_BTN =
  'inline-flex items-center gap-2 rounded-xl border border-sky-400/70 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-700 hover:border-sky-300 transition-colors';
