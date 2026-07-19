/**
 * Snapshot vs Strategy Guide — comparison rows for homepage + samples modal.
 */

export type ReportCompareLang = 'en' | 'zh-TW' | 'zh-CN';

export interface ReportCompareRow {
  feature: Record<ReportCompareLang, string>;
  snapshot: Record<ReportCompareLang, string>;
  guide: Record<ReportCompareLang, string>;
}

export const REPORT_COMPARE_TITLE: Record<ReportCompareLang, string> = {
  en: 'Snapshot vs Strategy Guide',
  'zh-TW': 'Snapshot 與 Strategy Guide 比較',
  'zh-CN': 'Snapshot 与 Strategy Guide 比较',
};

export const REPORT_COMPARE_SUBTITLE: Record<ReportCompareLang, string> = {
  en: 'Same JD + resume in → two different depths of output.',
  'zh-TW': '同樣的職缺與履歷，兩種不同深度的報告。',
  'zh-CN': '同样的职位与简历，两种不同深度的报告。',
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

export const REPORT_COMPARE_ROWS: ReportCompareRow[] = [
  {
    feature: {
      en: 'Best for',
      'zh-TW': '最適用',
      'zh-CN': '最适用',
    },
    snapshot: {
      en: 'Decide whether to apply',
      'zh-TW': '決定要不要投',
      'zh-CN': '决定要不要投',
    },
    guide: {
      en: 'Prepare interviews & negotiate',
      'zh-TW': '面試準備與談薪',
      'zh-CN': '面试准备与谈薪',
    },
  },
  {
    feature: {
      en: 'Model',
      'zh-TW': '模型',
      'zh-CN': '模型',
    },
    snapshot: {
      en: 'Flash-Lite (fast)',
      'zh-TW': 'Flash-Lite（快）',
      'zh-CN': 'Flash-Lite（快）',
    },
    guide: {
      en: 'Pro (deeper)',
      'zh-TW': 'Pro（更深）',
      'zh-CN': 'Pro（更深）',
    },
  },
  {
    feature: {
      en: 'Live web search',
      'zh-TW': '即時網搜',
      'zh-CN': '即时网搜',
    },
    snapshot: {
      en: 'No',
      'zh-TW': '無',
      'zh-CN': '无',
    },
    guide: {
      en: 'Yes (Google Search)',
      'zh-TW': '有（Google Search）',
      'zh-CN': '有（Google Search）',
    },
  },
  {
    feature: {
      en: 'Fit score + apply decision',
      'zh-TW': '匹配分數 + 投遞決策',
      'zh-CN': '匹配分数 + 投递决策',
    },
    snapshot: {
      en: 'Yes',
      'zh-TW': '有',
      'zh-CN': '有',
    },
    guide: {
      en: 'Yes (includes Snapshot)',
      'zh-TW': '有（含完整 Snapshot）',
      'zh-CN': '有（含完整 Snapshot）',
    },
  },
  {
    feature: {
      en: 'Expected offer range + your land',
      'zh-TW': '薪酬區間 + 個人落點',
      'zh-CN': '薪酬区间 + 个人落点',
    },
    snapshot: {
      en: 'Yes (market estimate when JD has no pay)',
      'zh-TW': '有（JD 未標薪時為市場估計）',
      'zh-CN': '有（JD 未标薪时为市场估计）',
    },
    guide: {
      en: 'Yes + negotiation levers',
      'zh-TW': '有 + 談判槓桿',
      'zh-CN': '有 + 谈判杠杆',
    },
  },
  {
    feature: {
      en: 'Hiring context / company intel',
      'zh-TW': '招募與公司情報',
      'zh-CN': '招募与公司情报',
    },
    snapshot: {
      en: '—',
      'zh-TW': '—',
      'zh-CN': '—',
    },
    guide: {
      en: 'Yes (grounded when available)',
      'zh-TW': '有（可 grounding）',
      'zh-CN': '有（可 grounding）',
    },
  },
  {
    feature: {
      en: 'Concerns & defenses',
      'zh-TW': '疑慮與答辯',
      'zh-CN': '疑虑与答辩',
    },
    snapshot: {
      en: '—',
      'zh-TW': '—',
      'zh-CN': '—',
    },
    guide: {
      en: 'Yes',
      'zh-TW': '有',
      'zh-CN': '有',
    },
  },
  {
    feature: {
      en: 'STAR interview bank',
      'zh-TW': 'STAR 面試題庫',
      'zh-CN': 'STAR 面试题库',
    },
    snapshot: {
      en: '3 predicted starters only',
      'zh-TW': '僅 3 題預測開場',
      'zh-CN': '仅 3 题预测开场',
    },
    guide: {
      en: 'Full playbook + STAR outlines',
      'zh-TW': '完整題庫 + STAR 大綱',
      'zh-CN': '完整题库 + STAR 大纲',
    },
  },
  {
    feature: {
      en: 'Offer negotiation script',
      'zh-TW': '談薪腳本',
      'zh-CN': '谈薪脚本',
    },
    snapshot: {
      en: '—',
      'zh-TW': '—',
      'zh-CN': '—',
    },
    guide: {
      en: 'Yes',
      'zh-TW': '有',
      'zh-CN': '有',
    },
  },
  {
    feature: {
      en: 'Credit pool',
      'zh-TW': '額度池',
      'zh-CN': '额度池',
    },
    snapshot: {
      en: 'Snapshot credits',
      'zh-TW': 'Snapshot 額度',
      'zh-CN': 'Snapshot 额度',
    },
    guide: {
      en: 'Strategy Guide credits (separate)',
      'zh-TW': 'Strategy Guide 額度（分開）',
      'zh-CN': 'Strategy Guide 额度（分开）',
    },
  },
  {
    feature: {
      en: 'Single report price',
      'zh-TW': '單次報告價格',
      'zh-CN': '单次报告价格',
    },
    snapshot: {
      en: '$3',
      'zh-TW': '$3',
      'zh-CN': '$3',
    },
    guide: {
      en: '$9.99',
      'zh-TW': '$9.99',
      'zh-CN': '$9.99',
    },
  },
];

export function resolveCompareLang(lang?: string): ReportCompareLang {
  if (lang === 'zh-TW' || lang === 'zh-CN') return lang;
  return 'en';
}
