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
    en: 'Stars = depth (out of 5). Same building blocks — Guide goes deeper and more actionable.',
    'zh-TW': '星星＝深度（滿分 5）。積木相同——Guide 更深、更可照做。',
    'zh-CN': '星星＝深度（满分 5）。积木相同——Guide 更深、更可照做。',
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
    help: help(
      'Who should buy which report: Snapshot for a fast apply / skip call; Guide when you will interview and negotiate this seat.',
      '誰該買哪一種：Snapshot 適合快速決定投不投；Guide 適合這席你真的會面試、談薪。',
      '谁该买哪一种：Snapshot 适合快速决定投不投；Guide 适合这席你真的会面试、谈薪。',
    ),
    snapshot: t('Decide whether to apply', '決定要不要投', '决定要不要投'),
    guide: t('Prepare interviews & negotiate', '面試準備與談薪', '面试准备与谈薪'),
  },
  // ── A. Shared (stars = depth) ──
  {
    section: 'shared',
    feature: {
      en: 'Fit score + apply decision',
      'zh-TW': '匹配分數 + 投遞決策',
      'zh-CN': '匹配分数 + 投递决策',
    },
    help: help(
      'A 0–100 candidate fit score for THIS JD, plus a clear apply call (Apply now / after fixes / clarify / skip) with a short why.',
      '針對這份 JD 的 0–100 匹配分數，加上清楚投遞決策（現在投／修好再投／先釐清／跳過）與簡短理由。',
      '针对这份 JD 的 0–100 匹配分数，加上清楚投递决策（现在投／修好再投／先澄清／跳过）与简短理由。',
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
      'Seat cash band (with evidence tier) plus where YOU are likely to land inside that band, given resume↔JD fit/gaps. Guide also ties this into negotiation.',
      '職缺現金薪酬帶（含證據等級），再加上依履歷↔JD 落差估計「你」可能落在哪；Guide 會接到談薪策略。',
      '职位现金薪酬带（含证据等级），再加上依简历↔JD 落差估计「你」可能落在哪；Guide 会接到谈薪策略。',
    ),
    snapshot: t('Range + predicted land', '區間 + 預測落點', '区间 + 预测落点', 3),
    guide: t('Range + land + negotiation levers', '區間 + 落點 + 談判槓桿', '区间 + 落点 + 谈判杠杆', 5),
  },
  {
    section: 'shared',
    feature: {
      en: 'Interview prep / STAR',
      'zh-TW': '面試準備 / STAR',
      'zh-CN': '面试准备 / STAR',
    },
    help: help(
      'Predicted interview angles from your gaps. Snapshot gives 3 starters; Guide expands into a full playbook with STAR outlines grounded in YOUR resume.',
      '依履歷缺口預測面試切入點。Snapshot 給 3 題開場；Guide 擴成完整題庫與依「你」履歷的 STAR 大綱。',
      '依简历缺口预测面试切入点。Snapshot 给 3 题开场；Guide 扩成完整题库与依「你」简历的 STAR 大纲。',
    ),
    snapshot: t('3 predicted starters', '僅 3 題預測開場', '仅 3 题预测开场', 2),
    guide: t('Full playbook + STAR outlines', '完整題庫 + STAR 大綱', '完整题库 + STAR 大纲', 5),
  },
  {
    section: 'shared',
    feature: {
      en: 'AI model — what it means',
      'zh-TW': 'AI 模型 — 代表什麼',
      'zh-CN': 'AI 模型 — 代表什么',
    },
    help: help(
      'Which model class runs the report. Flash-Lite = fast closed-book triage from JD + resume. Pro = deeper reasoning and live web when available.',
      '報告用哪一級模型。Flash-Lite＝快速、只讀 JD＋履歷；Pro＝更深推理，並在可取得時做即時網搜。',
      '报告用哪一级模型。Flash-Lite＝快速、只读 JD＋简历；Pro＝更深推理，并在可取得时做即时网搜。',
    ),
    snapshot: t(
      'Flash-Lite: fast triage, closed-book from JD + resume',
      'Flash-Lite：快速分流，只讀 JD＋履歷（無網搜）',
      'Flash-Lite：快速分流，只读 JD＋简历（无网搜）',
      3,
    ),
    guide: t(
      'Pro: deeper reasoning + live web — fewer thin answers, more checkable strategy',
      'Pro：更深推理＋即時網搜——少薄答案、策略可核對',
      'Pro：更深推理＋即时网搜——少薄答案、策略可核对',
      5,
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
    help: help(
      'Guide can ground claims in public web sources (URL + date when available) instead of model memory alone. Snapshot does not search the web.',
      'Guide 可用公開網頁來源（盡量附網址＋日期）核對情報，不只靠模型記憶。Snapshot 不做網搜。',
      'Guide 可用公开网页来源（尽量附网址＋日期）核对情报，不只靠模型记忆。Snapshot 不做网搜。',
    ),
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
    help: help(
      'Why this seat may be open, what the team/market signal looks like, and what to validate with the recruiter — Guide-only, often search-backed.',
      '這席為何可能開缺、團隊／市場訊號、該跟招募確認什麼——僅 Guide，常搭配網搜。',
      '这席为何可能开缺、团队／市场信号、该跟招募确认什么——仅 Guide，常搭配网搜。',
    ),
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
    help: help(
      'The top recruiter doubts about YOUR fit for THIS JD, plus how to answer without inventing experience.',
      '招募對「你做這席」最可能的疑慮，以及怎麼答——不捏造經歷。',
      '招募对「你做这席」最可能的疑虑，以及怎么答——不捏造经历。',
    ),
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
    help: help(
      'Target / acceptable / walk-away framing, levers (sign-on, equity, etc.), and copy-ready lines you can say in a comp conversation.',
      '目標／可接受／底線、談判槓桿（簽約金、股權等），以及談薪時可直接講的台詞。',
      '目标／可接受／底线、谈判杠杆（签约金、股权等），以及谈薪时可直接讲的台词。',
    ),
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
    help: help(
      'A short “why hire YOU for THIS seat” thesis in recruiter language — your proof points packaged as a hire case.',
      '用招募聽得懂的話，寫出「為何該錄取你做這席」——把證據收成錄取論點。',
      '用招募听得懂的话，写出「为何该录取你做这席」——把证据收成录取论点。',
    ),
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
