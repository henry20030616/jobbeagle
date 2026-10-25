/**
 * Snapshot + Guide report-frame header chrome (`ReportJobHeader`).
 * Product label stays small cyan (適配快照 / 面試指南) — never an H1.
 * Primary line is briefcase + job title. Company / posted are meta rows.
 * Both dashboards MUST use these tokens via the shared header so they cannot drift.
 */
export const REPORT_HEADER_SHELL = 'border-b border-slate-700/90 px-5 py-3.5';

export const REPORT_HEADER_PRODUCT_LABEL =
  'text-lg font-bold uppercase tracking-[0.14em] text-sky-400 mb-1';

/** Job title — briefcase + large white type (same as Snapshot’s Senior Business Analyst). */
export const REPORT_HEADER_JOB_LINE =
  'text-4xl font-black text-white flex items-center gap-2 flex-wrap leading-tight';

export const REPORT_HEADER_JOB_ICON = 'w-5 h-5 text-slate-400 shrink-0';

export const REPORT_HEADER_META = 'mt-2 space-y-1 text-lg';

export const REPORT_HEADER_META_ROW = 'flex items-center gap-2 text-slate-300';

export const REPORT_HEADER_META_ICON = 'w-5 h-5 shrink-0 text-slate-500';

export const REPORT_HEADER_META_LABEL =
  'text-slate-500 text-base font-semibold uppercase tracking-wide mr-2';
