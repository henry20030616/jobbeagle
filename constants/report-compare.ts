/**
 * Snapshot vs Strategy Guide — comparison rows for homepage + samples modal.
 * Structure: Best for → shared (depth notes) → Guide-only → price.
 */

export type ReportCompareLang = 'en' | 'zh-TW' | 'zh-CN';

export type ReportCompareSection = 'best_for' | 'shared' | 'guide_only' | 'meta';

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
  en: 'Snapshot: decide whether to apply. Guide: win interviews & negotiate — includes full Snapshot.',
  'zh-TW': 'Snapshot：決定要不要投。Guide：怎麼打贏面試、怎麼談錢——含完整 Snapshot。',
  'zh-CN': 'Snapshot：决定要不要投。Guide：怎么打赢面试、怎么谈钱——含完整 Snapshot。',
};

/** Callout under the title — what Pro model + deep report means in practice. */
export const REPORT_COMPARE_WHY_PRO: {
  title: Record<ReportCompareLang, string>;
  bullets: Record<ReportCompareLang, string>[];
} = {
  title: {
    en: 'Why Strategy Guide feels “professional”',
    'zh-TW': '專業級強在哪？',
    'zh-CN': '专业级强在哪？',
  },
  bullets: [
    {
      en: 'Stronger model: fewer shallow takes — it connects JD + resume + market context into a coherent hire/negotiate story.',
      'zh-TW': '更強模型：少空話，能把 JD、履歷與市場脈絡串成連貫的錄取／談薪故事。',
      'zh-CN': '更强模型：少空话，能把 JD、简历与市场脉络串成连贯的录取／谈薪故事。',
    },
    {
      en: 'Live search: claims can cite public sources (URL + date), not only model memory — so intel is checkable.',
      'zh-TW': '即時網搜：情報可掛公開來源（網址＋日期），不是只靠模型記憶——你能核對。',
      'zh-CN': '即时网搜：情报可挂公开来源（网址＋日期），不是只靠模型记忆——你能核对。',
    },
    {
      en: 'Depth = usable scripts: recruiter concerns + defenses, STAR outlines from YOUR resume, and a copy-ready negotiation path.',
      'zh-TW': '深度＝可照做：招募疑慮＋答辯、依你履歷的 STAR 大綱、可直接用的談薪路徑。',
      'zh-CN': '深度＝可照做：招募疑虑＋答辩、依你简历的 STAR 大纲、可直接用的谈薪路径。',
    },
    {
      en: 'Snapshot is triage speed; Guide is CHRO-level prep when this role is worth the fight.',
      'zh-TW': 'Snapshot 是快速分流；Guide 是這間值得拚時的 CHRO 級備戰。',
      'zh-CN': 'Snapshot 是快速分流；Guide 是这家值得拼时的 CHRO 级备战。',
    },
  ],
};

export const REPORT_COMPARE_SECTION_HINT: Record<
  ReportCompareSection,
  Record<ReportCompareLang, string> | null
> = {
  best_for: null,
  shared: {
    en: 'Same building blocks — Guide runs them on a deeper model and expands what you can act on.',
    'zh-TW': '積木相同——Guide 用更深模型跑，並擴成你能照著做的內容。',
    'zh-CN': '积木相同——Guide 用更深模型跑，并扩成你能照着做的内容。',
  },
  guide_only: {
    en: 'These only exist in Guide: evidence-backed intel + interview/offer playbooks.',
    'zh-TW': '以下僅 Guide 有：有出處的情報＋面試／談薪作戰手冊。',
    'zh-CN': '以下仅 Guide 有：有出处的情报＋面试／谈薪作战手册。',
  },
  meta: null,
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
  best_for: {
    en: '',
    'zh-TW': '',
    'zh-CN': '',
  },
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
    en: 'Price',
    'zh-TW': '價格',
    'zh-CN': '价格',
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
  // ── Top: Best for ──
  {
    section: 'best_for',
    feature: {
      en: 'Best for',
      'zh-TW': '最適用',
      'zh-CN': '最适用',
    },
    snapshot: t('Decide whether to apply', '決定要不要投', '决定要不要投'),
    guide: t('Prepare interviews & negotiate', '面試準備與談薪', '面试准备与谈薪'),
  },
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
      en: 'AI model — what it means',
      'zh-TW': 'AI 模型 — 代表什麼',
      'zh-CN': 'AI 模型 — 代表什么',
    },
    snapshot: t(
      'Flash-Lite: fast triage, closed-book from JD + resume',
      'Flash-Lite：快速分流，只讀 JD＋履歷（無網搜）',
      'Flash-Lite：快速分流，只读 JD＋简历（无网搜）',
    ),
    guide: t(
      'Pro: deeper reasoning + live web — fewer thin answers, more checkable strategy',
      'Pro：更深推理＋即時網搜——少薄答案、策略可核對',
      'Pro：更深推理＋即时网搜——少薄答案、策略可核对',
    ),
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
    guide: t(
      'Yes — public sources with URL + date when available',
      '有 — 公開來源盡量附網址＋日期',
      '有 — 公开来源尽量附网址＋日期',
    ),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Hiring context / company intel',
      'zh-TW': '招募與公司情報',
      'zh-CN': '招募与公司情报',
    },
    snapshot: t('—', '—', '—'),
    guide: t(
      'Yes — why this seat is open / what market is doing',
      '有 — 這席為何開缺／市場在發生什麼',
      '有 — 这席为何开缺／市场在发生什么',
    ),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Concerns & defenses',
      'zh-TW': '疑慮與答辯',
      'zh-CN': '疑虑与答辩',
    },
    snapshot: t('—', '—', '—'),
    guide: t(
      'Yes — 3 recruiter doubts + how to answer (no invention)',
      '有 — 3 個招募質疑＋怎麼答（不捏造經歷）',
      '有 — 3 个招募质疑＋怎么答（不捏造经历）',
    ),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Offer negotiation script',
      'zh-TW': '談薪腳本',
      'zh-CN': '谈薪脚本',
    },
    snapshot: t('—', '—', '—'),
    guide: t(
      'Yes — target / walk-away / levers / copy-ready lines',
      '有 — 目標／底線／槓桿／可直接講的台詞',
      '有 — 目标／底线／杠杆／可直接讲的台词',
    ),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Hire thesis (candidate case)',
      'zh-TW': '錄取論點（Candidate Case）',
      'zh-CN': '录取论点（Candidate Case）',
    },
    snapshot: t('—', '—', '—'),
    guide: t(
      'Yes — why hire YOU for THIS seat, in recruiter language',
      '有 — 為何該錄取「你」做「這席」，用招募聽得懂的話',
      '有 — 为何该录取「你」做「这席」，用招募听得懂的话',
    ),
  },
  // ── C. Price ──
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
