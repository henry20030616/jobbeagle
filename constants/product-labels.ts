/**
 * @deprecated Prefer `@/constants/report-products`.
 * Thin compatibility layer for older imports.
 */
export {
  reportLabel as reportProductLabel,
  reportBlurb as reportProductBlurb,
  normalizeReportType,
  REPORT_CODES,
  type ReportType,
} from '@/constants/report-products';

import { REPORT_PRODUCT } from '@/constants/report-products';

/** Legacy shape keyed by lite/full — prefer REPORT_PRODUCT. */
export const REPORT_PRODUCT_LABELS = {
  lite: {
    en: REPORT_PRODUCT.job_fit_snapshot.labelEn,
    'zh-TW': REPORT_PRODUCT.job_fit_snapshot.labelZhTW,
    'zh-CN': REPORT_PRODUCT.job_fit_snapshot.labelZhTW,
    shortEn: REPORT_PRODUCT.job_fit_snapshot.shortEn,
    shortZh: REPORT_PRODUCT.job_fit_snapshot.shortZh,
  },
  full: {
    en: REPORT_PRODUCT.interview_strategy_guide.labelEn,
    'zh-TW': REPORT_PRODUCT.interview_strategy_guide.labelZhTW,
    'zh-CN': REPORT_PRODUCT.interview_strategy_guide.labelZhTW,
    shortEn: REPORT_PRODUCT.interview_strategy_guide.shortEn,
    shortZh: REPORT_PRODUCT.interview_strategy_guide.shortZh,
  },
} as const;

export const CONFIRM_PAGE_LABELS = {
  title: {
    en: 'Confirm Job & Resume',
    'zh-TW': '確認職缺與履歷',
  },
  subtitle: {
    en: 'Review the captured job and your resume before analysis. Credits are used only after you launch.',
    'zh-TW': '請確認外掛抓取的職缺與您的履歷後再啟動分析；確認無誤才會扣除額度。',
  },
} as const;
