/**
 * Canonical product terminology — frontend + backend share these codes.
 * Display: Job Fit Snapshot / Interview Strategy Guide
 * API/DB:  job_fit_snapshot / interview_strategy_guide
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
    labelEn: 'Job Fit Snapshot',
    labelZhTW: 'Job Fit Snapshot',
    shortEn: 'Snapshot',
    shortZh: '匹配快照',
    blurbEn: 'No web search · Match score · Comp positioning',
    blurbZh: '無網搜 · 匹配分數 · 薪酬定位',
    legacyCodes: ['lite'] as const,
    creditField: 'job_fit_snapshot_credits' as const,
    dbCreditColumn: 'available_job_fit_snapshot_credits' as const,
  },
  interview_strategy_guide: {
    code: REPORT_CODES.INTERVIEW_STRATEGY_GUIDE as ReportType,
    labelEn: 'Interview Strategy Guide',
    labelZhTW: 'Interview Strategy Guide',
    shortEn: 'Strategy Guide',
    shortZh: '面試策略',
    blurbEn: 'Everything in Snapshot + live intel · STAR bank · Negotiation',
    blurbZh: '含完整 Snapshot · 即時情報 · STAR 題庫 · 談判腳本',
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

export function reportLabel(type: ReportType | string, lang: string = 'en'): string {
  const code = normalizeReportType(type);
  const p = REPORT_PRODUCT[code];
  return lang === 'zh-TW' || lang === 'zh-CN' ? p.labelZhTW : p.labelEn;
}

export function reportBlurb(type: ReportType | string, lang: string = 'en'): string {
  const code = normalizeReportType(type);
  const p = REPORT_PRODUCT[code];
  return lang === 'zh-TW' || lang === 'zh-CN' ? p.blurbZh : p.blurbEn;
}

export function reportShortLabel(type: ReportType | string, lang: string = 'en'): string {
  const code = normalizeReportType(type);
  const p = REPORT_PRODUCT[code];
  return lang === 'zh-TW' || lang === 'zh-CN' ? p.shortZh : p.shortEn;
}
