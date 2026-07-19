/**
 * Snapshot vs Strategy Guide — comparison rows for homepage + samples modal.
 */

export type ReportCompareLang = 'en' | 'zh-TW' | 'zh-CN';

/** Max stars shown for depth gaps on shared features. */
export const REPORT_COMPARE_STAR_MAX = 5;

export interface ReportCompareCell {
  text: Record<ReportCompareLang, string>;
  /**
   * 1–5 depth rating when both products have the feature.
   * Omit for Guide-only (✓) / Snapshot missing (—) / meta rows.
   */
  stars?: number;
}

export interface ReportCompareRow {
  feature: Record<ReportCompareLang, string>;
  snapshot: ReportCompareCell;
  guide: ReportCompareCell;
}

function t(
  en: string,
  zhTW: string,
  zhCN: string,
  stars?: number,
): ReportCompareCell {
  return {
    text: { en, 'zh-TW': zhTW, 'zh-CN': zhCN },
    ...(stars != null ? { stars } : {}),
  };
}

export const REPORT_COMPARE_TITLE: Record<ReportCompareLang, string> = {
  en: 'Snapshot vs Strategy Guide',
  'zh-TW': 'Snapshot 與 Strategy Guide 比較',
  'zh-CN': 'Snapshot 与 Strategy Guide 比较',
};

export const REPORT_COMPARE_SUBTITLE: Record<ReportCompareLang, string> = {
  en: 'Same JD + resume in → two different depths of output. Stars = depth when both include the item.',
  'zh-TW': '同樣的職缺與履歷，兩種不同深度。兩者都有的項目用星星標示程度差距。',
  'zh-CN': '同样的职位与简历，两种不同深度。两者都有的项目用星星标示程度差距。',
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

/**
 * Shared (star depth) first → Guide-only (✓ / —) → meta.
 * Stars out of 5: higher = deeper / more complete for that product.
 */
export const REPORT_COMPARE_ROWS: ReportCompareRow[] = [
  {
    feature: {
      en: 'Fit score + apply decision',
      'zh-TW': '匹配分數 + 投遞決策',
      'zh-CN': '匹配分数 + 投递决策',
    },
    snapshot: t('Core fit + apply call', '核心匹配 + 投遞決策', '核心匹配 + 投递决策', 4),
    guide: t('Full Snapshot + score implications', '完整 Snapshot + 分數意涵', '完整 Snapshot + 分数意涵', 5),
  },
  {
    feature: {
      en: 'Expected offer range + your land',
      'zh-TW': '薪酬區間 + 個人落點',
      'zh-CN': '薪酬区间 + 个人落点',
    },
    snapshot: t('Range + predicted land', '區間 + 預測落點', '区间 + 预测落点', 3),
    guide: t('Range + land + negotiation levers', '區間 + 落點 + 談判槓桿', '区间 + 落点 + 谈判杠杆', 5),
  },
  {
    feature: {
      en: 'Interview prep / STAR',
      'zh-TW': '面試準備 / STAR',
      'zh-CN': '面试准备 / STAR',
    },
    snapshot: t('3 predicted starters', '僅 3 題預測開場', '仅 3 题预测开场', 2),
    guide: t('Full playbook + STAR outlines', '完整題庫 + STAR 大綱', '完整题库 + STAR 大纲', 5),
  },
  {
    feature: {
      en: 'AI model depth',
      'zh-TW': 'AI 模型深度',
      'zh-CN': 'AI 模型深度',
    },
    snapshot: t('Flash-Lite (fast)', 'Flash-Lite（快）', 'Flash-Lite（快）', 3),
    guide: t('Latest Pro-class model', '最新 Pro 級模型', '最新 Pro 级模型', 5),
  },
  {
    feature: {
      en: 'Live web search',
      'zh-TW': '即時網搜',
      'zh-CN': '即时网搜',
    },
    snapshot: t('—', '—', '—'),
    guide: t('Yes (Google Search)', '有（Google Search）', '有（Google Search）'),
  },
  {
    feature: {
      en: 'Hiring context / company intel',
      'zh-TW': '招募與公司情報',
      'zh-CN': '招募与公司情报',
    },
    snapshot: t('—', '—', '—'),
    guide: t('Yes (grounded when available)', '有（可 grounding）', '有（可 grounding）'),
  },
  {
    feature: {
      en: 'Concerns & defenses',
      'zh-TW': '疑慮與答辯',
      'zh-CN': '疑虑与答辩',
    },
    snapshot: t('—', '—', '—'),
    guide: t('Yes', '有', '有'),
  },
  {
    feature: {
      en: 'Offer negotiation script',
      'zh-TW': '談薪腳本',
      'zh-CN': '谈薪脚本',
    },
    snapshot: t('—', '—', '—'),
    guide: t('Yes', '有', '有'),
  },
  {
    feature: {
      en: 'Best for',
      'zh-TW': '最適用',
      'zh-CN': '最适用',
    },
    snapshot: t('Decide whether to apply', '決定要不要投', '决定要不要投'),
    guide: t('Prepare interviews & negotiate', '面試準備與談薪', '面试准备与谈薪'),
  },
  {
    feature: {
      en: 'Credit pool',
      'zh-TW': '額度池',
      'zh-CN': '额度池',
    },
    snapshot: t('Snapshot credits', 'Snapshot 額度', 'Snapshot 额度'),
    guide: t('Strategy Guide credits (separate)', 'Strategy Guide 額度（分開）', 'Strategy Guide 额度（分开）'),
  },
  {
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
