/**
 * Snapshot vs Strategy Guide — comparison rows for homepage + samples modal.
 * Structure: shared (depth notes) → Guide-only → meta (best for / price).
 */

export type ReportCompareLang = 'en' | 'zh-TW' | 'zh-CN';

export type ReportCompareSection = 'shared' | 'guide_only' | 'meta';

export interface ReportCompareCell {
  text: Record<ReportCompareLang, string>;
}

export interface ReportCompareRow {
  section: ReportCompareSection;
  feature: Record<ReportCompareLang, string>;
  snapshot: ReportCompareCell;
  guide: ReportCompareCell;
}

function t(en: string, zhTW: string, zhCN: string): ReportCompareCell {
  return { text: { en, 'zh-TW': zhTW, 'zh-CN': zhCN } };
}

export const REPORT_COMPARE_TITLE: Record<ReportCompareLang, string> = {
  en: 'Snapshot vs Strategy Guide',
  'zh-TW': 'Snapshot 與 Strategy Guide 比較',
  'zh-CN': 'Snapshot 与 Strategy Guide 比较',
};

export const REPORT_COMPARE_SUBTITLE: Record<ReportCompareLang, string> = {
  en: 'Snapshot: decide whether to apply. Guide: win the process & negotiate — includes full Snapshot.',
  'zh-TW': 'Snapshot：決定要不要投。Guide：怎麼打贏、怎麼談錢——含完整 Snapshot。',
  'zh-CN': 'Snapshot：决定要不要投。Guide：怎么打赢、怎么谈钱——含完整 Snapshot。',
};

export const REPORT_COMPARE_TRIGGER: Record<ReportCompareLang, string> = {
  en: 'Compare the two reports',
  'zh-TW': '查看兩種報告差異',
  'zh-CN': '查看两种报告差异',
};

export const REPORT_COMPARE_CLOSE: Record<ReportCompareLang, string> = {
  en: 'Close',
  'zh-TW': '關閉',
  'zh-CN': '关闭',
};

export const REPORT_COMPARE_SECTION_LABEL: Record<
  ReportCompareSection,
  Record<ReportCompareLang, string>
> = {
  shared: {
    en: 'Included in both (depth differs)',
    'zh-TW': '兩者都有（深度不同）',
    'zh-CN': '两者都有（深度不同）',
  },
  guide_only: {
    en: 'Strategy Guide only — professional add-ons',
    'zh-TW': '僅 Strategy Guide — 專業版加值',
    'zh-CN': '仅 Strategy Guide — 专业版加值',
  },
  meta: {
    en: 'Who it’s for & price',
    'zh-TW': '適合對象與價格',
    'zh-CN': '适合对象与价格',
  },
};

export const REPORT_COMPARE_COL: {
  feature: Record<ReportCompareLang, string>;
  snapshot: Record<ReportCompareLang, string>;
  guide: Record<ReportCompareLang, string>;
} = {
  feature: {
    en: 'What you get',
    'zh-TW': '項目',
    'zh-CN': '项目',
  },
  snapshot: {
    en: 'Job Fit Snapshot',
    'zh-TW': 'Job Fit Snapshot',
    'zh-CN': 'Job Fit Snapshot',
  },
  guide: {
    en: 'Interview Strategy Guide',
    'zh-TW': 'Interview Strategy Guide',
    'zh-CN': 'Interview Strategy Guide',
  },
};

export const REPORT_COMPARE_ROWS: ReportCompareRow[] = [
  // ── A. Shared ──
  {
    section: 'shared',
    feature: {
      en: 'Fit score + apply decision',
      'zh-TW': '匹配分數 + 投遞決策',
      'zh-CN': '匹配分数 + 投递决策',
    },
    snapshot: t('Yes (core decision)', '有（核心決策）', '有（核心决策）'),
    guide: t('Yes (full Snapshot + implications)', '有（完整 Snapshot + 意涵）', '有（完整 Snapshot + 意涵）'),
  },
  {
    section: 'shared',
    feature: {
      en: 'Expected offer range + your land',
      'zh-TW': '薪酬區間 + 個人落點',
      'zh-CN': '薪酬区间 + 个人落点',
    },
    snapshot: t('Yes (estimate)', '有（估計）', '有（估计）'),
    guide: t('Yes (estimate + negotiation)', '有（估計 + 談判）', '有（估计 + 谈判）'),
  },
  {
    section: 'shared',
    feature: {
      en: 'Interview prep / STAR',
      'zh-TW': '面試準備 / STAR',
      'zh-CN': '面试准备 / STAR',
    },
    snapshot: t('Yes (3 starters only)', '有（僅 3 題開場）', '有（仅 3 题开场）'),
    guide: t('Yes (full playbook + STAR)', '有（完整題庫 + STAR）', '有（完整题库 + STAR）'),
  },
  {
    section: 'shared',
    feature: {
      en: 'AI model',
      'zh-TW': 'AI 模型',
      'zh-CN': 'AI 模型',
    },
    snapshot: t('Flash-Lite (fast)', 'Flash-Lite（快）', 'Flash-Lite（快）'),
    guide: t('Latest Pro-class model', '最新 Pro 級模型', '最新 Pro 级模型'),
  },
  // ── B. Guide only ──
  {
    section: 'guide_only',
    feature: {
      en: 'Live web search',
      'zh-TW': '即時網搜',
      'zh-CN': '即时网搜',
    },
    snapshot: t('—', '—', '—'),
    guide: t('Yes (Google Search)', '有（Google Search）', '有（Google Search）'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Hiring context / company intel',
      'zh-TW': '招募與公司情報',
      'zh-CN': '招募与公司情报',
    },
    snapshot: t('—', '—', '—'),
    guide: t('Yes (grounded when available)', '有（可 grounding）', '有（可 grounding）'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Concerns & defenses',
      'zh-TW': '疑慮與答辯',
      'zh-CN': '疑虑与答辩',
    },
    snapshot: t('—', '—', '—'),
    guide: t('Yes', '有', '有'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Offer negotiation script',
      'zh-TW': '談薪腳本',
      'zh-CN': '谈薪脚本',
    },
    snapshot: t('—', '—', '—'),
    guide: t('Yes', '有', '有'),
  },
  // ── C. Meta ──
  {
    section: 'meta',
    feature: {
      en: 'Best for',
      'zh-TW': '最適用',
      'zh-CN': '最适用',
    },
    snapshot: t('Decide whether to apply', '決定要不要投', '决定要不要投'),
    guide: t('Prepare interviews & negotiate', '面試準備與談薪', '面试准备与谈薪'),
  },
  {
    section: 'meta',
    feature: {
      en: 'Single report price',
      'zh-TW': '單次報告價格',
      'zh-CN': '单次报告价格',
    },
    snapshot: t('$3', '$3', '$3'),
    guide: t('$9.99', '$9.99', '$9.99'),
  },
];

export function resolveCompareLang(lang?: string): ReportCompareLang {
  if (lang === 'zh-TW' || lang === 'zh-CN') return lang;
  return 'en';
}
