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
    en: 'Stars = depth (out of 5). Same building blocks — Interview Guide goes deeper and more actionable.',
    'zh-TW': '星星＝深度（滿分 5）。積木相同——面試指南更深、更可照做。',
    'zh-CN': '星星＝深度（满分 5）。积木相同——面试指南更深、更可照做。',
  },
  guide_only: {
    en: 'Interview Guide only: H-1B and layoff intel, 20 sourced questions, your pay landing and TC split, plus a negotiation script.',
    'zh-TW': '僅面試指南：H-1B 與裁員情報、20 題附來源、個人落點與 TC 拆解，以及談薪說法。',
    'zh-CN': '仅面试指南：H-1B 与裁员情报、20 题附来源、个人落点与 TC 拆解，以及谈薪说法。',
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
  // ── Top: Best for ──
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
  // ── A. Shared (stars = depth) — AI model first ──
  {
    section: 'shared',
    feature: {
      en: 'AI model — what it means',
      'zh-TW': 'AI 模型 — 代表什麼',
      'zh-CN': 'AI 模型 — 代表什么',
    },
    help: help(
      'Which model class runs the report. Snapshot is a fast fit from JD + resume. Guide uses Pro with live web search.',
      '報告用哪一級模型。Snapshot＝依 JD＋履歷快速判斷適配；Guide＝Pro，並做即時網搜。',
      '报告用哪一级模型。Snapshot＝依 JD＋简历快速判断适配；Guide＝Pro，并做即时网搜。',
    ),
    snapshot: t('Fast fit from JD + resume', '依 JD＋履歷快速適配', '依 JD＋简历快速适配', 3),
    guide: t('Pro + live web search', 'Pro＋即時網搜', 'Pro＋即时网搜', 5),
  },
  {
    section: 'shared',
    feature: {
      en: 'Fit score + apply decision',
      'zh-TW': '匹配分數 + 投遞決策',
      'zh-CN': '匹配分数 + 投递决策',
    },
    help: help(
      'A candidate fit score for THIS JD, plus a clear apply call (Apply now / after fixes / clarify / skip) with a short why.',
      '針對這份 JD 的匹配分數，加上清楚投遞決策（現在投／修好再投／先釐清／跳過）與簡短理由。',
      '针对这份 JD 的匹配分数，加上清楚投递决策（现在投／修好再投／先澄清／跳过）与简短理由。',
    ),
    snapshot: t('Core fit + apply call', '核心匹配 + 投遞決策', '核心匹配 + 投递决策', 4),
    guide: t('Full Snapshot + score implications', '完整 Snapshot + 分數意涵', '完整 Snapshot + 分数意涵', 5),
  },
  {
    section: 'shared',
    feature: {
      en: 'Expected offer range + your land',
      'zh-TW': '薪酬區間 + 個人落點',
      'zh-CN': '薪酬区间 + 个人落点',
    },
    help: help(
      'Snapshot shows a wide market band for the seat. Interview Guide adds where YOU are likely to land, the base / equity / bonus split, and the negotiation script.',
      '適配快照給這席的寬薪酬帶。面試指南再加上你的落點、底薪／股票／獎金拆解，以及談薪說法。',
      '适配快照给这席的宽薪酬带。面试指南再加上你的落点、底薪／股票／奖金拆解，以及谈薪说法。',
    ),
    snapshot: t('Wide market band', '寬薪酬帶', '宽薪酬带', 3),
    guide: t('Landing + TC split + script', '落點 + TC 拆解 + 談薪', '落点 + TC 拆解 + 谈薪', 5),
  },
  {
    section: 'shared',
    feature: {
      en: 'Interview prep / STAR',
      'zh-TW': '面試準備 / STAR',
      'zh-CN': '面试准备 / STAR',
    },
    help: help(
      'Snapshot names missing hard keywords. Interview Guide adds 10 professional and 10 behavioral questions from the last three years, with source links and resume-grounded answers.',
      '適配快照點出缺的硬關鍵字。面試指南再加上近三年專業題與行為題各 10 題，附來源連結與依履歷的答法。',
      '适配快照点出缺的硬关键词。面试指南再加上近三年专业题与行为题各 10 题，附来源链接与依简历的答法。',
    ),
    snapshot: t('Missing keywords only', '只列缺的關鍵字', '只列缺的关键词', 2),
    guide: t('20 questions with sources', '20 題附來源', '20 题附来源', 5),
  },
  // ── B. Guide only ──
  {
    section: 'guide_only',
    feature: {
      en: 'Live web search',
      'zh-TW': '即時網搜',
      'zh-CN': '即时网搜',
    },
    help: help(
      'Guide pulls live public web data for THIS company and role — employee/Glassdoor-style reviews, reported interview questions, real salary posts, market/hiring signals, third-party industry reports, and professional HR/comp commentary — then cites URL + date when available.',
      'Guide 能即時搜這間公司／這席的公開網路資料——含公司與職位評價、真實面試題、真實薪資貼文、市場／招募現況、第三方產業報告、專業人資／薪酬諮詢觀點——並盡量附網址＋日期。',
      'Guide 能即时搜这家公司／这席的公开网络资料——含公司与职位评价、真实面试题、真实薪资贴文、市场／招募现况、第三方产业报告、专业人资／薪酬咨询观点——并尽量附网址＋日期。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t(
      'Yes — reviews, interview Qs, salary, market, industry/HR reports',
      '有 — 評價、面試題、薪資、市場、產業／人資報告',
      '有 — 评价、面试题、薪资、市场、产业／人资报告',
    ),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Hiring context / company intel',
      'zh-TW': '招募與公司情報',
      'zh-CN': '招募与公司情报',
    },
    help: help(
      'Why this seat may be open, culture and layoff or WARN signals, H-1B and remote or sponsorship notes, and what to validate with the recruiter.',
      '這席為何可能開缺、文化與裁員或 WARN、H-1B 與遠端／贊助，以及該跟招募確認什麼。',
      '这席为何可能开缺、文化与裁员或 WARN、H-1B 与远程／赞助，以及该跟招募确认什么。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t('Yes — culture, layoff, H-1B', '有 — 文化、裁員、H-1B', '有 — 文化、裁员、H-1B'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Concerns & defenses',
      'zh-TW': '疑慮與答辯',
      'zh-CN': '疑虑与答辩',
    },
    help: help(
      'The top recruiter doubts about YOUR fit for THIS JD, plus how to answer without inventing experience.',
      '招募對「你做這席」最可能的疑慮，以及怎麼答——不捏造經歷。',
      '招募对「你做这席」最可能的疑虑，以及怎么答——不捏造经历。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t('Yes — 3 doubts + answers', '有 — 3 疑慮＋答辯', '有 — 3 疑虑＋答辩'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Offer negotiation script',
      'zh-TW': '談薪腳本',
      'zh-CN': '谈薪脚本',
    },
    help: help(
      'Headhunter framing for pay (target, ceiling, base / equity / bonus) and a second pass for benefits such as sign-on, remote days, and sponsorship.',
      '獵頭級薪資說法（目標、上限、底薪／股票／獎金），以及第二段福利說法（簽約金、遠端、贊助）。',
      '猎头级薪资说法（目标、上限、底薪／股票／奖金），以及第二段福利说法（签约金、远程、赞助）。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t('Yes — pay script + benefits', '有 — 薪資說法 + 福利', '有 — 薪资说法 + 福利'),
  },
  {
    section: 'guide_only',
    feature: {
      en: 'Hire thesis (candidate case)',
      'zh-TW': '錄取論點（Candidate Case）',
      'zh-CN': '录取论点（Candidate Case）',
    },
    help: help(
      'A short “why hire YOU for THIS seat” thesis in recruiter language — your proof points packaged as a hire case.',
      '用招募聽得懂的話，寫出「為何該錄取你做這席」——把證據收成錄取論點。',
      '用招募听得懂的话，写出「为何该录取你做这席」——把证据收成录取论点。',
    ),
    snapshot: t('—', '—', '—'),
    guide: t('Yes — why hire you', '有 — 為何錄取你', '有 — 为何录取你'),
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
