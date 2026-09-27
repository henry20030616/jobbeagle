/**
 * Canonical product terminology — frontend + backend share these codes.
 * Display: Fit Snapshot / Interview Guide（適配快照 / 面試指南）
 * API/DB codes stay job_fit_snapshot / interview_strategy_guide (credits, orders).
 */

export const REPORT_CODES = {
  JOB_FIT_SNAPSHOT: 'job_fit_snapshot',
  INTERVIEW_STRATEGY_GUIDE: 'interview_strategy_guide',
} as const;

export type ReportType =
  | typeof REPORT_CODES.JOB_FIT_SNAPSHOT
  | typeof REPORT_CODES.INTERVIEW_STRATEGY_GUIDE;

/** @deprecated legacy wire values — normalize via normalizeReportType() */
export type LegacyReportType = 'lite' | 'full';

export const REPORT_PRODUCT = {
  job_fit_snapshot: {
    code: REPORT_CODES.JOB_FIT_SNAPSHOT as ReportType,
    labelEn: 'Fit Snapshot',
    labelZhTW: '適配快照',
    labelZhCN: '适配快照',
    shortEn: 'Fit Snapshot',
    shortZh: '適配快照',
    blurbEn: 'No web search · Decide whether to apply',
    blurbZh: '無網搜 · 決定要不要投',
    legacyCodes: ['lite'] as const,
    creditField: 'job_fit_snapshot_credits' as const,
    dbCreditColumn: 'available_job_fit_snapshot_credits' as const,
  },
  interview_strategy_guide: {
    code: REPORT_CODES.INTERVIEW_STRATEGY_GUIDE as ReportType,
    labelEn: 'Interview Guide',
    labelZhTW: '面試指南',
    labelZhCN: '面试指南',
    shortEn: 'Interview Guide',
    shortZh: '面試指南',
    blurbEn: 'Includes Fit Snapshot + live intel · interview · negotiate',
    blurbZh: '含適配快照 · 即時情報 · 面試與談薪',
    legacyCodes: ['full'] as const,
    creditField: 'interview_strategy_guide_credits' as const,
    dbCreditColumn: 'available_interview_strategy_guide_credits' as const,
  },
} as const;

export const CONFIRM_ROUTE = '/confirm';
/** Legacy extension / bookmarks */
export const CONFIRM_ROUTE_LEGACY = '/pre-flight';

export const CONFIRM_PAGE = {
  titleEn: 'Confirm Job & Resume',
  titleZh: '確認職缺與履歷',
  subtitleEn:
    'Review the captured job and your resume before analysis. Credits are used only after you launch.',
  subtitleZh: '請確認外掛抓取的職缺與您的履歷後再啟動分析；確認無誤才會扣除額度。',
} as const;

export function normalizeReportType(raw: unknown): ReportType {
  const v = String(raw || '').toLowerCase().trim();
  if (
    v === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE ||
    v === 'full' ||
    v === 'strategy' ||
    v === 'interview_strategy'
  ) {
    return REPORT_CODES.INTERVIEW_STRATEGY_GUIDE;
  }
  return REPORT_CODES.JOB_FIT_SNAPSHOT;
}

export function isInterviewStrategyGuide(type: ReportType | string): boolean {
  return normalizeReportType(type) === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE;
}

function reportProduct(type: ReportType | string) {
  return isInterviewStrategyGuide(type)
    ? REPORT_PRODUCT.interview_strategy_guide
    : REPORT_PRODUCT.job_fit_snapshot;
}

export function reportLabel(type: ReportType | string, lang: string = 'en'): string {
  const p = reportProduct(type);
  if (lang === 'zh-TW') return p.labelZhTW;
  if (lang === 'zh-CN') return p.labelZhCN;
  return p.labelEn;
}

export function reportBlurb(type: ReportType | string, lang: string = 'en'): string {
  const p = reportProduct(type);
  return lang === 'zh-TW' || lang === 'zh-CN' ? p.blurbZh : p.blurbEn;
}

export function reportShortLabel(type: ReportType | string, lang: string = 'en'): string {
  const p = reportProduct(type);
  return lang === 'zh-TW' || lang === 'zh-CN' ? p.shortZh : p.shortEn;
}
