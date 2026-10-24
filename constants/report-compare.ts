/**
 * Snapshot vs Strategy Guide — comparison rows for homepage + samples modal.
 * Structure: Best for → shared (star depth) → Guide-only → price.
 */

export type ReportCompareLang = 'en' | 'zh-TW' | 'zh-CN';

export type ReportCompareSection = 'best_for' | 'shared' | 'guide_only' | 'meta';

/** Max stars shown for depth gaps on shared features. */
export const REPORT_COMPARE_STAR_MAX = 5;

export interface ReportCompareCell {
  text: Record<ReportCompareLang, string>;
  /**
   * 1–5 depth rating when both products include the feature.
   * Omit for Guide-only (✓) / Snapshot missing (—) / meta rows.
   */
  stars?: number;
}

export interface ReportCompareRow {
  section: ReportCompareSection;
  feature: Record<ReportCompareLang, string>;
  /** Plain-language definition shown when the feature label is opened */
  help: Record<ReportCompareLang, string>;
  snapshot: ReportCompareCell;
  guide: ReportCompareCell;
}

function help(en: string, zhTW: string, zhCN: string): Record<ReportCompareLang, string> {
  return { en, 'zh-TW': zhTW, 'zh-CN': zhCN };
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
  en: 'Fit Snapshot vs Interview Guide',
  'zh-TW': '適配快照與面試指南比較',
  'zh-CN': '适配快照与面试指南比较',
};

export const REPORT_COMPARE_SUBTITLE_LINES: Record<
  ReportCompareLang,
  readonly [string, string]
> = {
  en: [
    'Fit Snapshot: decide whether to apply.',
    'Interview Guide: how to interview and negotiate — includes the Snapshot.',
  ],
  'zh-TW': [
    '適配快照：決定要不要投。',
    '面試指南：怎麼面、怎麼談——含完整適配快照。',
  ],
  'zh-CN': [
    '适配快照：决定要不要投。',
    '面试指南：怎么面、怎么谈——含完整适配快照。',
  ],
};

/** Single-line join for a11y / legacy callers. */
export const REPORT_COMPARE_SUBTITLE: Record<ReportCompareLang, string> = {
  en: REPORT_COMPARE_SUBTITLE_LINES.en.join(' '),
  'zh-TW': REPORT_COMPARE_SUBTITLE_LINES['zh-TW'].join(''),
  'zh-CN': REPORT_COMPARE_SUBTITLE_LINES['zh-CN'].join(''),
};

/** Callout under the title — what Pro model + deep report means in practice. */
export const REPORT_COMPARE_WHY_PRO: {
  title: Record<ReportCompareLang, string>;
  bullets: Record<ReportCompareLang, string>[];
} = {
  title: {
    en: 'Why Interview Guide feels “professional”',
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
      en: 'Live search: company reviews, layoff and H-1B signals, 20 interview questions, and salary posts — cited with URL + date when available.',
      'zh-TW': '即時網搜：公司評價、裁員與 H-1B 訊號、20 題面試題、薪資貼文——盡量附網址＋日期。',
      'zh-CN': '即时网搜：公司评价、裁员与 H-1B 信号、20 题面试题、薪资贴文——尽量附网址＋日期。',
    },
    {
      en: 'Depth = usable scripts: a TC split, answers grounded in YOUR resume, and a headhunter script for pay and benefits.',
      'zh-TW': '深度＝可照做：TC 拆解、依你履歷的答法、獵頭級薪資與福利說法。',
      'zh-CN': '深度＝可照做：TC 拆解、依你简历的答法、猎头级薪资与福利说法。',
    },
    {
      en: 'Fit Snapshot is triage speed; Interview Guide is prep when this role is worth the fight.',
      'zh-TW': '適配快照是快速分流；面試指南是這間值得拚時的備戰。',
      'zh-CN': '适配快照是快速分流；面试指南是这家值得拼时的备战。',
    },
  ],
};

export const REPORT_COMPARE_SECTION_HINT: Record<
  ReportCompareSection,
  Record<ReportCompareLang, string> | null
> = {
  best_for: null,
  shared: {
    en: 'Stars = depth (out of 5). These three items are the Snapshot; the Guide includes them and goes deeper on fit.',
    'zh-TW': '星星＝深度（滿分 5）。這三項就是適配快照；面試指南含這三項，履歷分析會再加深。',
    'zh-CN': '星星＝深度（满分 5）。这三项就是适配快照；面试指南含这三项，简历分析会再加深。',
  },
  guide_only: {
    en: 'Interview Guide only: pay landing, company and role intel, sourced interview questions, and negotiation.',
    'zh-TW': '僅面試指南：個人化薪資落點、公司與職位評價、面試真題準備、面試談判建議。',
    'zh-CN': '仅面试指南：个人化薪资落点、公司与职位评价、面试真题准备、面试谈判建议。',
  },
  meta: null,
};

export const REPORT_COMPARE_TRIGGER: Record<ReportCompareLang, string> = {
  en: 'Report differences',
  'zh-TW': '兩種報告差異',
  'zh-CN': '两种报告差异',
};

export const REPORT_COMPARE_CLOSE: Record<ReportCompareLang, string> = {
  en: 'Close',
  'zh-TW': '關閉',
  'zh-CN': '关闭',
};

export const REPORT_COMPARE_FIELD_HELP_HINT: Record<ReportCompareLang, string> = {
  en: 'Tap a field name for a short definition',
  'zh-TW': '點項目名稱可看簡短說明',
  'zh-CN': '点项目名称可看简短说明',
};

export const REPORT_COMPARE_FIELD_HELP_ARIA: Record<ReportCompareLang, string> = {
  en: 'What this field means',
  'zh-TW': '這個欄位是什麼意思',
  'zh-CN': '这个栏位是什么意思',
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
    en: 'Interview Guide only',
    'zh-TW': '僅面試指南',
    'zh-CN': '仅面试指南',
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
    en: 'Fit Snapshot',
    'zh-TW': '適配快照',
    'zh-CN': '适配快照',
  },
  guide: {
    en: 'Interview Guide',
    'zh-TW': '面試指南',
    'zh-CN': '面试指南',
  },
};

export const REPORT_COMPARE_ROWS: ReportCompareRow[] = [
  {
    section: 'best_for',
    feature: {
      en: 'Best for',
      'zh-TW': '最適用',
      'zh-CN': '最适用',
    },
    help: help(
      'Who should buy which report: Snapshot for a fast apply / skip call; Guide when you will interview and negotiate this seat.',
      '誰該買哪一種：Snapshot 適合快速決定投不投；Guide 適合這席你真的會面試、談薪。',
      '谁该买哪一种：Snapshot 适合快速决定投不投；Guide 适合这席你真的会面试、谈薪。',
    ),
    snapshot: t('Decide whether to apply', '決定要不要投', '决定要不要投'),
    guide: t('Prepare interviews & negotiate', '面試準備與談薪', '面试准备与谈薪'),
  },
  {
    section: 'shared',
    feature: {
      en: 'Role core',
      'zh-TW': '職位核心解析',
      'zh-CN': '职位核心解析',
    },
    help: help(
      'Job overview plus the must-haves and real duties for this seat, read from the posting.',
      '職位概述，以及這席的關鍵條件與關鍵職責，依職缺內文整理。',
      '职位概述，以及这席的关键条件与关键职责，依职位正文整理。',
    ),
    snapshot: t('Overview, must-haves, duties', '職位概述、條件、職責', '职位概述、条件、职责', 4),
    guide: t('Same Snapshot section', '同適配快照這一項', '同适配快照这一项', 4),
  },
  {
    section: 'shared',
    feature: {
      en: 'Fit analysis',
      'zh-TW': '匹配度分析',
      'zh-CN': '匹配度分析',
    },
    help: help(
      'Fit summary, score, Beagle Scale with apply advice beside it, then full-width missing hard keywords. Guide adds line-by-line resume rewrites for those gaps.',
      '總結分析、匹配分數；藍寶米格魯左側、應徵建議右側；下方全寬欠缺的硬性關鍵字。面試指南再加上針對缺口的履歷改寫。',
      '总结分析、匹配分数；蓝宝米格鲁左侧、应征建议右侧；下方全宽欠缺的硬性关键字。面试指南再加上针对缺口的简历改写。',
    ),
    snapshot: t('Score, apply call, keywords', '分數、應徵建議、關鍵字', '分数、应征建议、关键字', 4),
    guide: t('Snapshot + resume rewrites', '快照內容 + 履歷改寫', '快照内容 + 简历改写', 5),
  },
  {
    section: 'shared',
    feature: {
      en: 'Market pay',
      'zh-TW': '市場薪資水準',
      'zh-CN': '市场薪资水准',
    },
    help: help(
      'A market total-compensation range from the posting’s title, location, and level — not company pay data. Your personal landing is a Guide-only item.',
      '依職缺的職稱、地點與職級估計的市場總薪酬區間。非公司數據，為市場薪資水準。個人化落點在面試指南專屬項目。',
      '依职位的职称、地点与职级估计的市场总薪酬区间。非公司数据，为市场薪资水准。个人化落点在面试指南专属项目。',
    ),
    snapshot: t('Market total-comp range', '市場總薪酬區間', '市场总薪酬区间', 4),
    guide: t('Same Snapshot section', '同適配快照這一項', '同适配快照这一项', 4),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Personalized pay landing',
      'zh-TW': '個人化薪資落點',
      'zh-CN': '个人化薪资落点',
    },
    help: help(
      'Where you are likely to land, with a base / equity / bonus split, a ceiling, and company vs candidate stance. Uses live public pay pages when search finds them.',
      '你比較可能落到的總薪酬，含底薪／股票／獎金、議價上限，以及公司與求職者立場。有公開薪酬頁時會附來源。',
      '你比较可能落到的总薪酬，含底薪／股票／奖金、议价上限，以及公司与求职者立场。有公开薪酬页时会附来源。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t('Landing, TC split, stances', '落點、TC 拆解、雙方立場', '落点、TC 拆解、双方立场'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Company and role reputation',
      'zh-TW': '公司與職位評價',
      'zh-CN': '公司与职位评价',
    },
    help: help(
      'Cited public intel on this employer and this seat: culture, layoff or WARN, visa sponsorship, and role reviews.',
      '有來源的公開情報：雇主文化、裁員或 WARN、簽證贊助，以及這個職位的評價。',
      '有来源的公开情报：雇主文化、裁员或 WARN、签证赞助，以及这个职位的评价。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t('Culture, layoff, visa, reviews', '文化、裁員、簽證、職位評價', '文化、裁员、签证、职位评价'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Interview questions',
      'zh-TW': '面試真題準備',
      'zh-CN': '面试真题准备',
    },
    help: help(
      'Ten professional and ten behavioral questions from the last three years, with sources on reported items and answers mapped to your resume.',
      '近三年專業題與行為題各 10 題。真題附來源，答法對照你的履歷。',
      '近三年专业题与行为题各 10 题。真题附来源，答法对照你的简历。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t('20 questions with sources', '20 題附來源與答法', '20 题附来源与答法'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Negotiation',
      'zh-TW': '面試談判建議',
      'zh-CN': '面试谈判建议',
    },
    help: help(
      'What to say on pay and benefits, questions to ask the company, and a post-interview note when one is needed.',
      '薪資與福利怎麼開口、建議問公司的問題，以及需要時的面試後信件。',
      '薪资与福利怎么开口、建议问公司的问题，以及需要时的面试后信件。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t('Script, asks, follow-up note', '談薪說法、提問、面試後信', '谈薪说法、提问、面试后信'),
  },
  // ── C. Price ──
  {
    section: 'meta',
    feature: {
      en: 'Single report price',
      'zh-TW': '單次報告價格',
      'zh-CN': '单次报告价格',
    },
    help: help(
      'One-time checkout price for a single report of that type. Credits / packs (if any) are separate from this row.',
      '該類型報告的單次結帳價格。若有額度／組合包，不在這一列說明。',
      '该类型报告的单次结账价格。若有额度／组合包，不在这一列说明。',
    ),
    snapshot: t('$3', '$3', '$3'),
    guide: t('$9.99', '$9.99', '$9.99'),
  },
];

export function resolveCompareLang(lang?: string): ReportCompareLang {
  if (lang === 'zh-TW' || lang === 'zh-CN') return lang;
  return 'en';
}
