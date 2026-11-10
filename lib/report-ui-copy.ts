import {
  normalizeReportLanguage,
  type AppLanguage,
} from '@/lib/report-language';
import type { ApplyDecisionLabel } from '@/types';

/** Snapshot slide chrome (labels only — body comes from the model). */
export interface SnapshotUiCopy {
  productTitle: string;
  company: string;
  posted: string;
  fit: string;
  candidateFitScore: string;
  expectedOffer: string;
  noOfferBand: string;
  topStrengths: string;
  applyDecisionFallback: string;
  applyLabels: Record<ApplyDecisionLabel, string>;
  criticalGaps: string;
  scoreSummary: string;
  applyDecision: string;
  hardSkill: string;
  softSkill: string;
  atsWarningTitle: string;
  atsPassRate: (pct: number) => string;
  atsHighRiskPrefix: string;
  atsMissingKeywords: (count: number, keywords: string) => string;
  backHome: string;
  newAnalysis: string;
  base: string;
  equityRsu: string;
  signOn: string;
  total: string;
  unknownRole: string;
  unknownCompany: string;
}

export interface GuideNavItemCopy {
  label: string;
  blurb: string;
}

export interface GuideUiCopy {
  productTitle: string;
  productSubtitle: string;
  backHome: string;
  newAnalysis: string;
  nav: {
    snapshot: GuideNavItemCopy;
    hiring: GuideNavItemCopy;
    interview: GuideNavItemCopy;
    salary: GuideNavItemCopy;
    provenance: GuideNavItemCopy;
  };
  // Page 2
  page2Of: string;
  page2Title: string;
  seatPainLabel: string;
  thirtySecondPitchLabel: string;
  macroRiskLabel: string;
  interviewerStyleLabel: string;
  icebreakerLabel: string;
  hiddenRubricLabel: string;
  badgeSampleThin: string;
  badgeTeamSignals: string;
  roleContent: string;
  roleContentHint: string;
  requirements: string;
  requirementsHint: string;
  rtoOfficial: string;
  rtoOfficialSource: string;
  rtoReality: string;
  rtoRealitySource: string;
  teamSampleInsufficient: string;
  nextTitle: string;
  nextTitleBasisFallback: string;
  noSalaryOnPage: string;
  promotionGaps: string;
  downgradeTitle: string;
  downgradeNote: string;
  atsBoxTitle: string;
  atsBoxIntro: (count: number) => string;
  atsJdRequires: string;
  atsResumeWeakness: string;
  atsFixInInterview: string;
  atsGapKeywordMissing: string;
  atsGapQuantificationWeak: string;
  atsGapExperienceUnclear: string;
  atsSeverityCritical: string;
  atsSeverityMajor: string;
  // Page 3
  page3Of: string;
  page3Title: string;
  badgeForumThin: string;
  badgeRiskAudit: string;
  companyOverview: string;
  companyOverviewHint: string;
  companyOverviewEmpty: string;
  recentDevelopments: string;
  recentDevelopmentsHint: string;
  recentDevelopmentsEmpty: string;
  newsCatLeadership: string;
  newsCatProduct: string;
  newsCatAward: string;
  newsCatFunding: string;
  newsCatOther: string;
  currentStrategy: string;
  currentStrategyHint: string;
  competitors: string;
  competitorsHint: string;
  strengthLabel: string;
  weaknessLabel: string;
  insiderVoice: string;
  forumThinBadge: string;
  forumThinFallback: string;
  insiderHint: string;
  layoffLegal: string;
  noLayoffRecord: string;
  strategyQuestions: string;
  strategyQuestionsNote: string;
  // Page 4
  page4Of: string;
  page4Title: string;
  /** Plain-language page badge — never jargon like "HIGH ROI" */
  page4Badge: string;
  /** Same Snapshot salary trio: range · median · predicted land */
  offerRangeTitle: string;
  noOfferBand: string;
  offerMedianLabel: string;
  predictedLandLabel: string;
  tcBreakdown: string;
  tcHint: string;
  tcBase: string;
  tcRsu: string;
  tcSignOn: string;
  negotiateScript: string;
  prepareStep: string;
  pitchStep: string;
  counterStep: string;
  behavioralTitle: string;
  technicalTitle: string;
  predictedBadge: string;
  reportedBadge: string;
  categoryBehavioral: string;
  categoryTechnical: string;
  questionSourceLabel: string;
  systemAnalysisSourceNote: string;
  intentLabel: string;
  starLabel: string;
  resumeAnchorLabel: string;
  dosDontsLabel: string;
  extraReportedTitle: string;
  noExtraReported: string;
  // Page 5
  page5Of: string;
  page5Title: string;
  page5Badge: string;
  ragCount: string;
  ragSourcesHint: string;
  invalidLinkTitle: string;
  invalidLinkBody: string;
  neverFakeUrl: string;
  webReferences: string;
  noDirectUrl: string;
  manualVerifyPrefix: string;
  noDirectLinkParen: string;
  provenanceFooter: string;
  emptyRoleContent: string;
  emptyRequirements: string;
}

type Dict<T> = Record<AppLanguage, T>;

const SNAPSHOT: Dict<SnapshotUiCopy> = {
  en: {
    productTitle: 'Fit Snapshot',
    company: 'Company',
    posted: 'Posted',
    fit: 'Fit',
    candidateFitScore: 'Candidate Fit Score',
    expectedOffer: 'Expected Offer Range',
    noOfferBand: 'No reliable offer band yet',
    topStrengths: 'Top Strengths',
    criticalGaps: 'Critical Gaps',
    scoreSummary: 'Score Summary',
    applyDecision: 'Apply advice',
    applyDecisionFallback: 'Apply advice',
    applyLabels: {
      'Apply now': 'Apply now',
      'Apply after fixes': 'Apply with caution',
      'Clarify first': 'Clarify first',
      Skip: "Don't apply",
    },
    hardSkill: 'Hard skill',
    softSkill: 'Soft skill',
    atsWarningTitle: 'ATS reject risk',
    atsPassRate: (pct) => `Estimated ATS pass rate: ${pct}% (high auto-reject risk)`,
    atsHighRiskPrefix: 'High risk of auto-reject: ',
    atsMissingKeywords: (count, keywords) =>
      ` Missing ${count} core keyword${count === 1 ? '' : 's'}${keywords ? ` (${keywords})` : ''}; flagged in Critical Gaps below.`,
    backHome: 'Back to Home',
    newAnalysis: 'New Analysis',
    base: 'Base',
    equityRsu: 'Equity/RSU',
    signOn: 'Sign-on',
    total: 'Total',
    unknownRole: 'Unknown Role',
    unknownCompany: 'Unknown Company',
  },
  'zh-TW': {
    productTitle: '適配快照',
    company: '公司',
    posted: '刊登',
    fit: '適配',
    candidateFitScore: '候選人適配分數',
    expectedOffer: '預期薪資區間',
    noOfferBand: '尚無可靠薪資區間',
    topStrengths: '關鍵優勢',
    criticalGaps: '關鍵缺口',
    scoreSummary: '分數摘要',
    applyDecision: '應徵建議',
    applyDecisionFallback: '應徵建議',
    applyLabels: {
      'Apply now': '應徵',
      'Apply after fixes': '謹慎應徵',
      'Clarify first': '先釐清再投',
      Skip: '不建議應徵',
    },
    hardSkill: '硬技能',
    softSkill: '軟技能',
    atsWarningTitle: 'ATS 淘汰預警',
    atsPassRate: (pct) => `ATS 通過預估率：${pct}%（高風險被系統自動刷掉）`,
    atsHighRiskPrefix: '高風險被系統自動刷掉：',
    atsMissingKeywords: (count, keywords) =>
      ` 缺少 ${count} 個核心關鍵字${keywords ? `（${keywords}）` : ''}，已在下方關鍵缺口標註。`,
    backHome: '回首頁',
    newAnalysis: '重新分析',
    base: '底薪',
    equityRsu: '股票/RSU',
    signOn: '簽約金',
    total: '總酬',
    unknownRole: '未知職缺',
    unknownCompany: '未知公司',
  },
  'zh-CN': {
    productTitle: '适配快照',
    company: '公司',
    posted: '发布',
    fit: '适配',
    candidateFitScore: '候选人适配分数',
    expectedOffer: '预期薪酬区间',
    noOfferBand: '尚无可靠薪酬区间',
    topStrengths: '关键优势',
    criticalGaps: '关键缺口',
    scoreSummary: '分数摘要',
    applyDecision: '应征建议',
    applyDecisionFallback: '应征建议',
    applyLabels: {
      'Apply now': '应征',
      'Apply after fixes': '谨慎应征',
      'Clarify first': '先澄清再投',
      Skip: '不建议应征',
    },
    hardSkill: '硬技能',
    softSkill: '软技能',
    atsWarningTitle: 'ATS 淘汰预警',
    atsPassRate: (pct) => `ATS 通过预估率：${pct}%（高风险被系统自动刷掉）`,
    atsHighRiskPrefix: '高风险被系统自动刷掉：',
    atsMissingKeywords: (count, keywords) =>
      ` 缺少 ${count} 个核心关键字${keywords ? `（${keywords}）` : ''}，已在下方关键缺口标注。`,
    backHome: '回首页',
    newAnalysis: '重新分析',
    base: '底薪',
    equityRsu: '股票/RSU',
    signOn: '签约金',
    total: '总酬',
    unknownRole: '未知职位',
    unknownCompany: '未知公司',
  },
};

const GUIDE: Dict<GuideUiCopy> = {
  en: {
    productTitle: 'Interview Guide',
    productSubtitle: 'Snapshot + playbook — switch pages from the top nav',
    backHome: 'Back to Home',
    newAnalysis: 'New Analysis',
    nav: {
      snapshot: {
        label: 'Snapshot',
        blurb: 'One-page fit score, offer range, strengths and gaps.',
      },
      hiring: {
        label: 'Role & team',
        blurb: 'What the job does, must-haves, official RTO vs reality, 1–3yr next title and promotion gaps (no salary).',
      },
      interview: {
        label: 'Company truth',
        blurb: 'Current strategy, competitors, insider voice, layoff/legal flags, and reverse questions.',
      },
      salary: {
        label: 'Interview & offer',
        blurb: '5 behavioral + 5 technical STAR cards, TC (Base/RSU/Sign-on), negotiation script.',
      },
      provenance: {
        label: 'Evidence chain',
        blurb: 'RAG source links; if no URL, manual-verify keywords — never fake URLs.',
      },
    },
    page2Of: 'PAGE 2 OF 5',
    page2Title: 'Role & team reality',
    seatPainLabel: 'What this seat is hired to fix',
    thirtySecondPitchLabel: '30-second intro',
    macroRiskLabel: 'Material risk',
    interviewerStyleLabel: 'How this interviewer talks',
    icebreakerLabel: 'Icebreakers',
    hiddenRubricLabel: 'Hidden grading rubric',
    badgeSampleThin: 'Thin sample',
    badgeTeamSignals: 'TEAM SIGNALS',
    roleContent: 'What this job actually does',
    roleContentHint: 'Plain-language highlights — not a copy-paste of the posting',
    requirements: 'Must-have requirements',
    requirementsHint: 'The hire bar that screeners care about most',
    rtoOfficial: 'Work mode / RTO (official)',
    rtoOfficialSource: 'Source: JD / company careers page',
    rtoReality: 'Employee reality (OT / WLB)',
    rtoRealitySource: 'Source: LinkedIn / Glassdoor / forums (not official PR)',
    teamSampleInsufficient: 'Public sample for this team is insufficient',
    nextTitle: 'Likely next title in 1–3 years',
    nextTitleBasisFallback:
      'Company ladder not public — inferred from market career paths (e.g. Levels.fyi / LinkedIn / employment reports).',
    noSalaryOnPage: 'Dollar salary amounts are on Snapshot / Interview & offer — not this page',
    promotionGaps: 'Skills to close for that next title',
    downgradeTitle: 'When team data is thin',
    downgradeNote:
      'If this specific team has no public reviews: use same department/level signals, or mark “public sample for this team is insufficient”. Never invent team gossip. Next-title still uses market career paths.',
    atsBoxTitle: 'ATS screening risk (from Snapshot)',
    atsBoxIntro: (count) =>
      `These ${count} items can trigger auto-reject — and how to close them in the interview.`,
    atsJdRequires: 'JD requires',
    atsResumeWeakness: 'Resume weakness',
    atsFixInInterview: 'How to fix in the interview',
    atsGapKeywordMissing: 'Missing keyword',
    atsGapQuantificationWeak: 'Weak quantification',
    atsGapExperienceUnclear: 'Unclear experience',
    atsSeverityCritical: 'Critical',
    atsSeverityMajor: 'Major',
    page3Of: 'PAGE 3 OF 5',
    page3Title: 'Company truth & risk',
    badgeForumThin: 'Thin forum signal',
    badgeRiskAudit: 'RISK AUDIT',
    companyOverview: 'Company snapshot',
    companyOverviewHint:
      'What kind of company this is right now — industry, customers, stage, market posture',
    companyOverviewEmpty:
      'Not enough public signal to sketch the company snapshot — verify on the careers site and recent news.',
    recentDevelopments: 'Recent company developments',
    recentDevelopmentsHint:
      'Up to 5 most relevant public items — leadership, major product launches, awards, funding',
    recentDevelopmentsEmpty:
      'No citable recent public news found — do not invent headlines; check the company newsroom and reputable press.',
    newsCatLeadership: 'Leadership',
    newsCatProduct: 'Product',
    newsCatAward: 'Award',
    newsCatFunding: 'Funding',
    newsCatOther: 'News',
    currentStrategy: 'What the company is focused on now',
    currentStrategyHint: 'Near-term bets from public signals — not a company history lesson',
    competitors: 'Industry competitors (2–3)',
    competitorsHint: 'Named firms competing for the same market — not other job applicants',
    strengthLabel: 'Edge:',
    weaknessLabel: 'Gap:',
    insiderVoice: 'Insider voice (Glassdoor / Blind / Reddit)',
    forumThinBadge: 'Thin public forum signal',
    forumThinFallback: 'Thin public forum signal — do not invent sentiment.',
    insiderHint: 'Filter official PR; focus on manager style / WLB / toxic patterns',
    layoffLegal: 'Layoff.fyi / public litigation & controversy',
    noLayoffRecord: 'No significant public layoff/legal red flags found',
    strategyQuestions: 'Strategy questions you can ask interviewers',
    strategyQuestionsNote:
      'If there is no public layoff/legal record, do not invent one — output 2–3 strategy questions instead.',
    page4Of: 'PAGE 4 OF 5',
    page4Title: 'Interview & offer strategy',
    page4Badge: 'Highest prep payoff',
    offerRangeTitle: 'Expected offer range',
    noOfferBand: 'No reliable offer band yet',
    offerMedianLabel: 'Seat median',
    predictedLandLabel: 'Your predicted land',
    tcBreakdown: 'TC mix (Levels.fyi-class sources)',
    tcHint: 'Base + Equity/RSU + Sign-on — market mix for this seat',
    tcBase: 'Base',
    tcRsu: 'Equity/RSU',
    tcSignOn: 'Sign-on',
    negotiateScript: 'Negotiation script (personal context)',
    prepareStep: '1. Prepare (anchor)',
    pitchStep: '2. Personal value pitch',
    counterStep: '3. Counter if rejected',
    behavioralTitle: 'Behavioral (5)',
    technicalTitle: 'Technical / case (5)',
    predictedBadge: 'System analysis',
    reportedBadge: 'Reported',
    categoryBehavioral: 'Behavioral',
    categoryTechnical: 'Technical / case',
    questionSourceLabel: 'Source',
    systemAnalysisSourceNote: 'System analysis (resume ↔ JD gaps) — not a cited real question',
    intentLabel: 'Intent: ',
    starLabel: 'STAR outline (from your resume): ',
    resumeAnchorLabel: 'Resume anchor: ',
    dosDontsLabel: "Do's & Don'ts: ",
    extraReportedTitle: '',
    noExtraReported: '',
    page5Of: 'PAGE 5 OF 5',
    page5Title: 'References & evidence chain',
    page5Badge: 'Sources you can verify',
    ragCount: 'RAG citation count',
    ragSourcesHint: 'Reddit/Blind threads, Levels.fyi, Layoff, news — original links',
    invalidLinkTitle: 'Missing URL handling',
    invalidLinkBody: 'If RAG cannot find a direct URL: write a retrieval summary + manual-verify keywords.',
    neverFakeUrl: ' Never invent fake URLs.',
    webReferences: 'Web sources & references',
    noDirectUrl: 'No direct URL — verify manually',
    manualVerifyPrefix: 'Retrieval summary & suggested manual-verify keywords: ',
    noDirectLinkParen: '(no direct link)',
    provenanceFooter:
      'This guide is an AI summary of public search results. JobBeagle is not affiliated with the cited sites or the employer.\nPay figures are estimates, not an offer. Interview questions are not confirmed by the employer. Open the source links to verify before you decide.',
    emptyRoleContent: 'Role content not extracted in this run.',
    emptyRequirements: 'Requirements not extracted in this run.',
  },
  'zh-TW': {
    productTitle: '面試指南',
    productSubtitle: '快照 + 作戰手冊 — 用上方導覽切換頁面',
    backHome: '回首頁',
    newAnalysis: '重新分析',
    nav: {
      snapshot: { label: '快照', blurb: '一頁適配分數、薪資區間、優勢與缺口。' },
      hiring: {
        label: '職位與團隊',
        blurb: '工作內容、錄取關鍵條件、RTO 官方 vs 體感、1–3 年下一職銜與升遷缺口（無薪資）。',
      },
      interview: {
        label: '公司真相',
        blurb: '當前戰略、競爭對手、內部聲響、Layoff/訴訟與反問題。',
      },
      salary: {
        label: '面試與談薪',
        blurb: '各 5 題行為／專業 STAR、TC（Base/RSU/Sign-on）、談薪腳本。',
      },
      provenance: {
        label: '證據鏈',
        blurb: 'RAG 原始連結；無 URL 則給手動查證關鍵字，絕不假網址。',
      },
    },
    page2Of: '第 2 / 5 頁',
    page2Title: '職位與團隊現況',
    seatPainLabel: '這職位要補的洞',
    thirtySecondPitchLabel: '30 秒自介',
    macroRiskLabel: '重大風險',
    interviewerStyleLabel: '面試官怎麼說話',
    icebreakerLabel: '破冰',
    hiddenRubricLabel: '隱藏評分標準',
    badgeSampleThin: '樣本不足',
    badgeTeamSignals: '團隊訊號',
    roleContent: '這份工作在做什麼',
    roleContentHint: '用人看得懂的重點整理，不是職缺原文貼上',
    requirements: '錄取關鍵條件',
    requirementsHint: '篩選者最在意的硬門檻',
    rtoOfficial: '工作型態 / RTO（官方）',
    rtoOfficialSource: '來源：JD / Company Career Page',
    rtoReality: '真實體感（加班 / WLB）',
    rtoRealitySource: '來源：LinkedIn / Glassdoor / 論壇（非官方 PR）',
    teamSampleInsufficient: '該團隊公開樣本不足',
    nextTitle: '1–3 年可能的下一職銜',
    nextTitleBasisFallback:
      '公司未公開內部職等表 — 依產業職涯路徑推估（如 Levels.fyi／LinkedIn／就業市場報告）。',
    noSalaryOnPage: '具體薪資金額請看「快照」或「面試與談薪」頁',
    promotionGaps: '要往下一職銜補的能力缺口',
    downgradeTitle: '團隊資訊不足時怎麼辦',
    downgradeNote:
      '若該特定團隊在網路上無公開評價：改看同部門／同職等整體風向，或標註「該團隊公開樣本不足」。不得編造八卦。下一職銜仍會用市場職涯路徑推估，不會空白。',
    atsBoxTitle: 'ATS 篩選風險（對應快照缺口）',
    atsBoxIntro: (count) =>
      `快照提到的自動篩選風險，這裡拆成 ${count} 項——以及面試時怎麼補。`,
    atsJdRequires: '職缺要求',
    atsResumeWeakness: '履歷弱點',
    atsFixInInterview: '面試時怎麼補',
    atsGapKeywordMissing: '缺關鍵字',
    atsGapQuantificationWeak: '量化不足',
    atsGapExperienceUnclear: '經驗寫不清',
    atsSeverityCritical: '關鍵',
    atsSeverityMajor: '重要',
    page3Of: '第 3 / 5 頁',
    page3Title: '公司真相與風險',
    badgeForumThin: '論壇聲量少',
    badgeRiskAudit: '風險稽核',
    companyOverview: '公司現況',
    companyOverviewHint: '這是怎樣的一間公司——產業、客群、階段、市場位置',
    companyOverviewEmpty: '公開訊號不足以勾勒公司現況——請到官網職涯頁與近期新聞自行核對。',
    recentDevelopments: '公司最近發展',
    recentDevelopmentsHint: '最多 5 則最相關公開新聞——經營層、重大產品、獲獎、融資等',
    recentDevelopmentsEmpty:
      '找不到可引用的近期公開新聞——不編造標題；請查公司新聞室與可信媒體。',
    newsCatLeadership: '經營層',
    newsCatProduct: '產品',
    newsCatAward: '獲獎',
    newsCatFunding: '融資',
    newsCatOther: '新聞',
    currentStrategy: '公司現在在拚什麼',
    currentStrategyHint: '近期待辦與公開訊號，不是公司沿革介紹',
    competitors: '產業競爭對手（2–3 家）',
    competitorsHint: '與這家公司搶市場的具名企業，不是其他求職者',
    strengthLabel: '優勢：',
    weaknessLabel: '劣勢：',
    insiderVoice: '內部人真實聲響（Glassdoor / Blind / Reddit）',
    forumThinBadge: '公開論壇聲量較少',
    forumThinFallback: '公開論壇聲量較少 — 不編造風向。',
    insiderHint: '過濾官方 PR；聚焦主管風格 / WLB / Toxic',
    layoffLegal: 'Layoff.fyi / 公開訴訟與爭議',
    noLayoffRecord: '無顯著公開違法/裁員紀錄',
    strategyQuestions: '面試可反問的公司營運戰略問題',
    strategyQuestionsNote: '降級條款：若無公開違法/裁員紀錄，不得編造；改輸出 2–3 題戰略問題。',
    page4Of: '第 4 / 5 頁',
    page4Title: '面試與談薪策略',
    page4Badge: '準備最划算',
    offerRangeTitle: '預期薪資區間',
    noOfferBand: '尚無可靠薪資區間',
    offerMedianLabel: '座位中位數',
    predictedLandLabel: '你的落點預測',
    tcBreakdown: 'TC 結構拆解（Levels.fyi 等）',
    tcHint: 'Base + 股票/RSU + Sign-on — 市場行情占比',
    tcBase: 'Base 底薪',
    tcRsu: '股票/RSU',
    tcSignOn: 'Sign-on 簽約金',
    negotiateScript: '談薪腳本（個人 Context）',
    prepareStep: '1. 談薪前準備（錨定點）',
    pitchStep: '2. 個人價值 Pitch',
    counterStep: '3. 被拒時 Counter',
    behavioralTitle: '行為題（5）',
    technicalTitle: '專業／案例題（5）',
    predictedBadge: '系統分析',
    reportedBadge: '真題',
    categoryBehavioral: '行為題',
    categoryTechnical: '專業／案例題',
    questionSourceLabel: '來源',
    systemAnalysisSourceNote: '系統分析（履歷↔JD 缺口）— 非檢索到的真題',
    intentLabel: '考察意圖：',
    starLabel: 'STAR 大綱（依你的履歷）：',
    resumeAnchorLabel: '履歷錨點：',
    dosDontsLabel: "Do's & Don'ts：",
    extraReportedTitle: '',
    noExtraReported: '',
    page5Of: '第 5 / 5 頁',
    page5Title: '參考資料與證據鏈',
    page5Badge: '來源可查證',
    ragCount: 'RAG 引用條數',
    ragSourcesHint: 'Reddit/Blind 討論串、Levels.fyi、Layoff、新聞等原始連結',
    invalidLinkTitle: '無效連結處理',
    invalidLinkBody: '若 RAG 檢索不到直接 URL：寫明「檢索數據摘要與建議手動查證關鍵字」，',
    neverFakeUrl: '絕不填充假網址。',
    webReferences: '網路資訊與參考資料',
    noDirectUrl: '無直接 URL — 請手動查證',
    manualVerifyPrefix: '檢索數據摘要與建議手動查證關鍵字：',
    noDirectLinkParen: '（無直接連結）',
    provenanceFooter:
      '本指南由 AI 依公開搜尋結果整理，JobBeagle 與所引用網站及雇主皆無關聯。\n薪資為估計值，並非錄取條件；面試題未經雇主確認。決策前請點開資料來源自行核對。',
    emptyRoleContent: '本次未抽出職位內容。',
    emptyRequirements: '本次未抽出要求條件。',
  },
  'zh-CN': {
    productTitle: '面试指南',
    productSubtitle: '快照 + 作战手册 — 用上方导航切换页面',
    backHome: '回首页',
    newAnalysis: '重新分析',
    nav: {
      snapshot: { label: '快照', blurb: '一页适配分数、薪酬区间、优势与缺口。' },
      hiring: {
        label: '职位与团队',
        blurb: '工作内容、录取关键条件、RTO 官方 vs 体感、1–3 年下一职衔与晋升缺口（无薪酬）。',
      },
      interview: {
        label: '公司真相',
        blurb: '当前战略、竞争对手、内部声响、Layoff/诉讼与反问题。',
      },
      salary: {
        label: '面试与谈薪',
        blurb: '各 5 题行为／专业 STAR、TC（Base/RSU/Sign-on）、谈薪脚本。',
      },
      provenance: {
        label: '证据链',
        blurb: 'RAG 原始链接；无 URL 则给手动查证关键词，绝不假网址。',
      },
    },
    page2Of: '第 2 / 5 页',
    page2Title: '职位与团队现况',
    seatPainLabel: '这职位要补的洞',
    thirtySecondPitchLabel: '30 秒自介',
    macroRiskLabel: '重大风险',
    interviewerStyleLabel: '面试官怎么说话',
    icebreakerLabel: '破冰',
    hiddenRubricLabel: '隐藏评分标准',
    badgeSampleThin: '样本不足',
    badgeTeamSignals: '团队信号',
    roleContent: '这份工作在做什么',
    roleContentHint: '用人看得懂的重点整理，不是职位原文粘贴',
    requirements: '录取关键条件',
    requirementsHint: '筛选者最在意的硬门槛',
    rtoOfficial: '工作形态 / RTO（官方）',
    rtoOfficialSource: '来源：JD / Company Career Page',
    rtoReality: '真实体感（加班 / WLB）',
    rtoRealitySource: '来源：LinkedIn / Glassdoor / 论坛（非官方 PR）',
    teamSampleInsufficient: '该团队公开样本不足',
    nextTitle: '1–3 年可能的下一职衔',
    nextTitleBasisFallback:
      '公司未公开内部职等表 — 依产业职涯路径推估（如 Levels.fyi／LinkedIn／就业市场报告）。',
    noSalaryOnPage: '具体薪酬金额请看「快照」或「面试与谈薪」页',
    promotionGaps: '要往下一职衔补的能力缺口',
    downgradeTitle: '团队信息不足时怎么办',
    downgradeNote:
      '若该特定团队在网上无公开评价：改看同部门／同职等整体风向，或标注「该团队公开样本不足」。不得编造八卦。下一职衔仍会用市场职涯路径推估，不会空白。',
    atsBoxTitle: 'ATS 筛选风险（对应快照缺口）',
    atsBoxIntro: (count) =>
      `快照提到的自动筛选风险，这里拆成 ${count} 项——以及面试时怎么补。`,
    atsJdRequires: '职位要求',
    atsResumeWeakness: '简历弱点',
    atsFixInInterview: '面试时怎么补',
    atsGapKeywordMissing: '缺关键字',
    atsGapQuantificationWeak: '量化不足',
    atsGapExperienceUnclear: '经验写不清',
    atsSeverityCritical: '关键',
    atsSeverityMajor: '重要',
    page3Of: '第 3 / 5 页',
    page3Title: '公司真相与风险',
    badgeForumThin: '论坛声量少',
    badgeRiskAudit: '风险稽核',
    companyOverview: '公司现况',
    companyOverviewHint: '这是怎样的一家公司——产业、客群、阶段、市场位置',
    companyOverviewEmpty: '公开信号不足以勾勒公司现况——请到官网职涯页与近期新闻自行核对。',
    recentDevelopments: '公司最近发展',
    recentDevelopmentsHint: '最多 5 则最相关公开新闻——经营层、重大产品、获奖、融资等',
    recentDevelopmentsEmpty:
      '找不到可引用的近期公开新闻——不编造标题；请查公司新闻室与可信媒体。',
    newsCatLeadership: '经营层',
    newsCatProduct: '产品',
    newsCatAward: '获奖',
    newsCatFunding: '融资',
    newsCatOther: '新闻',
    currentStrategy: '公司现在在拼什么',
    currentStrategyHint: '近期待办与公开信号，不是公司沿革介绍',
    competitors: '产业竞争对手（2–3 家）',
    competitorsHint: '与这家公司抢市场的具名企业，不是其他求职者',
    strengthLabel: '优势：',
    weaknessLabel: '劣势：',
    insiderVoice: '内部人真实声响（Glassdoor / Blind / Reddit）',
    forumThinBadge: '公开论坛声量较少',
    forumThinFallback: '公开论坛声量较少 — 不编造风向。',
    insiderHint: '过滤官方 PR；聚焦主管风格 / WLB / Toxic',
    layoffLegal: 'Layoff.fyi / 公开诉讼与争议',
    noLayoffRecord: '无显著公开违法/裁员记录',
    strategyQuestions: '面试可反问的公司营运战略问题',
    strategyQuestionsNote: '降级条款：若无公开违法/裁员记录，不得编造；改输出 2–3 题战略问题。',
    page4Of: '第 4 / 5 页',
    page4Title: '面试与谈薪策略',
    page4Badge: '准备最划算',
    offerRangeTitle: '预期薪酬区间',
    noOfferBand: '尚无可靠薪酬区间',
    offerMedianLabel: '座位中位数',
    predictedLandLabel: '你的落点预测',
    tcBreakdown: 'TC 结构拆解（Levels.fyi 等）',
    tcHint: 'Base + 股票/RSU + Sign-on — 市场行情占比',
    tcBase: 'Base 底薪',
    tcRsu: '股票/RSU',
    tcSignOn: 'Sign-on 签约金',
    negotiateScript: '谈薪脚本（个人 Context）',
    prepareStep: '1. 谈薪前准备（锚定点）',
    pitchStep: '2. 个人价值 Pitch',
    counterStep: '3. 被拒时 Counter',
    behavioralTitle: '行为题（5）',
    technicalTitle: '专业／案例题（5）',
    predictedBadge: '系统分析',
    reportedBadge: '真题',
    categoryBehavioral: '行为题',
    categoryTechnical: '专业／案例题',
    questionSourceLabel: '来源',
    systemAnalysisSourceNote: '系统分析（简历↔JD 缺口）— 非检索到的真题',
    intentLabel: '考察意图：',
    starLabel: 'STAR 大纲（依据你的简历）：',
    resumeAnchorLabel: '简历锚点：',
    dosDontsLabel: "Do's & Don'ts：",
    extraReportedTitle: '',
    noExtraReported: '',
    page5Of: '第 5 / 5 页',
    page5Title: '参考资料与证据链',
    page5Badge: '来源可查证',
    ragCount: 'RAG 引用条数',
    ragSourcesHint: 'Reddit/Blind 讨论串、Levels.fyi、Layoff、新闻等原始链接',
    invalidLinkTitle: '无效链接处理',
    invalidLinkBody: '若 RAG 检索不到直接 URL：写明「检索数据摘要与建议手动查证关键词」，',
    neverFakeUrl: '绝不填充假网址。',
    webReferences: '网络信息与参考资料',
    noDirectUrl: '无直接 URL — 请手动查证',
    manualVerifyPrefix: '检索数据摘要与建议手动查证关键词：',
    noDirectLinkParen: '（无直接链接）',
    provenanceFooter:
      '本指南由 AI 依公开搜索结果整理，JobBeagle 与所引用网站及雇主均无关联。\n薪资为估计值，并非录用条件；面试题未经雇主确认。决策前请点开资料来源自行核对。',
    emptyRoleContent: '本次未抽出职位内容。',
    emptyRequirements: '本次未抽出要求条件。',
  },
};

export function getSnapshotUiCopy(language?: string | null): SnapshotUiCopy {
  const lang = normalizeReportLanguage(language);
  return SNAPSHOT[lang] ?? SNAPSHOT.en;
}

function isApplyDecisionLabel(value: string): value is ApplyDecisionLabel {
  return (
    value === 'Apply now'
    || value === 'Apply after fixes'
    || value === 'Clarify first'
    || value === 'Skip'
  );
}

/** Localized apply / don't-apply call for Snapshot 應徵建議. */
export function applyCallLabel(
  label: string | null | undefined,
  language?: string | null,
): string {
  const copy = getSnapshotUiCopy(language);
  if (label && isApplyDecisionLabel(label)) return copy.applyLabels[label];
  return copy.applyDecisionFallback;
}

export function getGuideUiCopy(language?: string | null): GuideUiCopy {
  const lang = normalizeReportLanguage(language);
  return GUIDE[lang] ?? GUIDE.en;
}
