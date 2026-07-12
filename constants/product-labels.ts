import type { ReportType } from '@/types';

/** User-facing product names (internal codes stay lite / full). */
export const REPORT_PRODUCT_LABELS = {
  lite: {
    en: 'Job Fit Snapshot',
    'zh-TW': 'Job Fit Snapshot',
    'zh-CN': 'Job Fit Snapshot',
    shortEn: 'Snapshot',
    shortZh: '匹配快照',
  },
  full: {
    en: 'Interview Strategy Guide',
    'zh-TW': 'Interview Strategy Guide',
    'zh-CN': 'Interview Strategy Guide',
    shortEn: 'Strategy Guide',
    shortZh: '面試策略',
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

export function reportProductLabel(
  type: ReportType | 'lite' | 'full',
  lang: string = 'en',
): string {
  const key = type === 'full' ? 'full' : 'lite';
  const pack = REPORT_PRODUCT_LABELS[key];
  if (lang === 'zh-TW' || lang === 'zh-CN') return pack['zh-TW'];
  return pack.en;
}

export function reportProductBlurb(
  type: ReportType | 'lite' | 'full',
  lang: string = 'en',
): string {
  const zh = lang === 'zh-TW' || lang === 'zh-CN';
  if (type === 'full') {
    return zh
      ? '即時公司情報 · STAR 題庫 · 談判腳本'
      : 'Live company intel · STAR bank · Negotiation script';
  }
  return zh
    ? '無網搜 · 匹配分數 · 薪酬定位'
    : 'No web search · Match score · Comp positioning';
}
