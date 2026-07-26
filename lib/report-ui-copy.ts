import {
  normalizeReportLanguage,
  type AppLanguage,
} from '@/lib/report-language';

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
  applyLabels: Record<string, string>;
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
  badgeSampleThin: string;
  badgeTeamSignals: string;
  roleContent: string;
  roleContentHint: string;
  requirements: string;
  rtoOfficial: string;
  rtoOfficialSource: string;
  rtoReality: string;
  rtoRealitySource: string;
  teamSampleInsufficient: string;
  nextTitle: string;
  noSalaryOnPage: string;
  promotionGaps: string;
  downgradeTitle: string;
  downgradeNote: string;
  // Page 3
  page3Of: string;
  page3Title: string;
  badgeForumThin: string;
  badgeRiskAudit: string;
  currentStrategy: string;
  competitors: string;
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
  intentLabel: string;
  starLabel: string;
  dosDontsLabel: string;
  extraReportedTitle: string;
  noExtraReported: string;
  // Page 5
  page5Of: string;
  page5Title: string;
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
    productTitle: 'Job Fit Snapshot',
    company: 'Company',
    posted: 'Posted',
    fit: 'Fit',
    candidateFitScore: 'Candidate Fit Score',
    expectedOffer: 'Expected Offer Range',
    noOfferBand: 'No reliable offer band yet',
    topStrengths: 'Top Strengths',
    criticalGaps: 'Critical Gaps',
    scoreSummary: 'Score Summary',
    applyDecision: 'Apply Decision',
    applyDecisionFallback: 'Apply decision',
    applyLabels: {
      'Apply now': 'Apply now',
      'Apply after fixes': 'Apply after fixes',
      'Clarify first': 'Clarify first',
      Skip: 'Skip',
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
    productTitle: '職缺適配快照',
    company: '公司',
    posted: '刊登',
    fit: '適配',
    candidateFitScore: '候選人適配分數',
    expectedOffer: '預期薪資區間',
    noOfferBand: '尚無可靠薪資區間',
    topStrengths: '關鍵優勢',
    criticalGaps: '關鍵缺口',
    scoreSummary: '分數摘要',
    applyDecision: '投遞決策',
    applyDecisionFallback: '投遞決策',
    applyLabels: {
      'Apply now': '立即投遞',
      'Apply after fixes': '補強後再投',
      'Clarify first': '先釐清再投',
      Skip: '略過',
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
    productTitle: '职位适配快照',
    company: '公司',
    posted: '发布',
    fit: '适配',
    candidateFitScore: '候选人适配分数',
    expectedOffer: '预期薪酬区间',
    noOfferBand: '尚无可靠薪酬区间',
    topStrengths: '关键优势',
    criticalGaps: '关键缺口',
    scoreSummary: '分数摘要',
    applyDecision: '投递决策',
    applyDecisionFallback: '投递决策',
    applyLabels: {
      'Apply now': '立即投递',
      'Apply after fixes': '补强后再投',
      'Clarify first': '先澄清再投',
      Skip: '跳过',
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
  es: {
    productTitle: 'Instantánea de encaje',
    company: 'Empresa',
    posted: 'Publicado',
    fit: 'Encaje',
    candidateFitScore: 'Puntuación de encaje',
    expectedOffer: 'Rango de oferta esperada',
    noOfferBand: 'Aún no hay banda salarial fiable',
    topStrengths: 'Fortalezas clave',
    criticalGaps: 'Brechas críticas',
    scoreSummary: 'Resumen de puntuación',
    applyDecision: 'Decisión de postulación',
    applyDecisionFallback: 'Decisión de postulación',
    applyLabels: {
      'Apply now': 'Postular ahora',
      'Apply after fixes': 'Postular tras corregir',
      'Clarify first': 'Aclarar primero',
      Skip: 'Omitir',
    },
    hardSkill: 'Hard skill',
    softSkill: 'Soft skill',
    atsWarningTitle: 'Riesgo de rechazo ATS',
    atsPassRate: (pct) => `Tasa estimada de paso ATS: ${pct}% (alto riesgo de rechazo automático)`,
    atsHighRiskPrefix: 'Alto riesgo de rechazo automático: ',
    atsMissingKeywords: (count, keywords) =>
      ` Faltan ${count} palabra${count === 1 ? '' : 's'} clave${keywords ? ` (${keywords})` : ''}; marcadas abajo.`,
    backHome: 'Volver al inicio',
    newAnalysis: 'Nuevo análisis',
    base: 'Base',
    equityRsu: 'Equity/RSU',
    signOn: 'Sign-on',
    total: 'Total',
    unknownRole: 'Rol desconocido',
    unknownCompany: 'Empresa desconocida',
  },
  hi: {
    productTitle: 'जॉब फिट स्नैपशॉट',
    company: 'कंपनी',
    posted: 'पोस्टेड',
    fit: 'फिट',
    candidateFitScore: 'कैंडिडेट फिट स्कोर',
    expectedOffer: 'अपेक्षित ऑफर रेंज',
    noOfferBand: 'अभी कोई विश्वसनीय ऑफर बैंड नहीं',
    topStrengths: 'मुख्य ताकत',
    criticalGaps: 'मुख्य गैप',
    scoreSummary: 'स्कोर सारांश',
    applyDecision: 'आवेदन निर्णय',
    applyDecisionFallback: 'आवेदन निर्णय',
    applyLabels: {
      'Apply now': 'अभी आवेदन करें',
      'Apply after fixes': 'सुधार के बाद आवेदन',
      'Clarify first': 'पहले स्पष्ट करें',
      Skip: 'छोड़ें',
    },
    hardSkill: 'हार्ड स्किल',
    softSkill: 'सॉफ्ट स्किल',
    atsWarningTitle: 'ATS रिजेक्ट जोखिम',
    atsPassRate: (pct) => `अनुमानित ATS पास दर: ${pct}% (ऑटो-रिजेक्ट जोखिम अधिक)`,
    atsHighRiskPrefix: 'ऑटो-रिजेक्ट का उच्च जोखिम: ',
    atsMissingKeywords: (count, keywords) =>
      ` ${count} मुख्य कीवर्ड गायब${keywords ? ` (${keywords})` : ''}; नीचे Critical Gaps में।`,
    backHome: 'होम पर वापस',
    newAnalysis: 'नया विश्लेषण',
    base: 'बेस',
    equityRsu: 'Equity/RSU',
    signOn: 'Sign-on',
    total: 'कुल',
    unknownRole: 'अज्ञात भूमिका',
    unknownCompany: 'अज्ञात कंपनी',
  },
  ar: {
    productTitle: 'لقطة ملاءمة الوظيفة',
    company: 'الشركة',
    posted: 'تاريخ النشر',
    fit: 'الملاءمة',
    candidateFitScore: 'درجة ملاءمة المرشح',
    expectedOffer: 'نطاق العرض المتوقع',
    noOfferBand: 'لا يوجد نطاق عرض موثوق بعد',
    topStrengths: 'أبرز نقاط القوة',
    criticalGaps: 'الفجوات الحرجة',
    scoreSummary: 'ملخص الدرجة',
    applyDecision: 'قرار التقديم',
    applyDecisionFallback: 'قرار التقديم',
    applyLabels: {
      'Apply now': 'قدّم الآن',
      'Apply after fixes': 'قدّم بعد الإصلاح',
      'Clarify first': 'وضّح أولًا',
      Skip: 'تخطَّ',
    },
    hardSkill: 'مهارة صلبة',
    softSkill: 'مهارة ناعمة',
    atsWarningTitle: 'خطر رفض ATS',
    atsPassRate: (pct) => `معدل مرور ATS التقديري: ${pct}% (خطر رفض تلقائي مرتفع)`,
    atsHighRiskPrefix: 'خطر مرتفع للرفض التلقائي: ',
    atsMissingKeywords: (count, keywords) =>
      ` ينقص ${count} كلمة مفتاحية أساسية${keywords ? ` (${keywords})` : ''}؛ موضحة أدناه.`,
    backHome: 'العودة للرئيسية',
    newAnalysis: 'تحليل جديد',
    base: 'الراتب الأساسي',
    equityRsu: 'أسهم/RSU',
    signOn: 'مكافأة التوقيع',
    total: 'الإجمالي',
    unknownRole: 'دور غير معروف',
    unknownCompany: 'شركة غير معروفة',
  },
};

const GUIDE: Dict<GuideUiCopy> = {
  en: {
    productTitle: 'Interview Strategy Guide',
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
        blurb: 'Refined role/requirements, official RTO vs reality, 1–3yr title and promotion gaps (no salary).',
      },
      interview: {
        label: 'Company truth',
        blurb: 'Current strategy, competitors, insider voice, layoff/legal flags, and reverse questions.',
      },
      salary: {
        label: 'Interview & offer',
        blurb: '3–5 behavioral/technical STAR cards, TC (Base/RSU/Sign-on), negotiation script.',
      },
      provenance: {
        label: 'Evidence chain',
        blurb: 'RAG source links; if no URL, manual-verify keywords — never fake URLs.',
      },
    },
    page2Of: 'PAGE 2 OF 5',
    page2Title: 'Role & team reality',
    badgeSampleThin: 'Thin sample',
    badgeTeamSignals: 'TEAM SIGNALS',
    roleContent: 'Role content (refined)',
    roleContentHint: 'Never paste the JD verbatim',
    requirements: 'Requirements (refined)',
    rtoOfficial: 'Work mode / RTO (official)',
    rtoOfficialSource: 'Source: JD / company careers page',
    rtoReality: 'Employee reality (OT / WLB)',
    rtoRealitySource: 'Source: LinkedIn / Glassdoor / forums (not official PR)',
    teamSampleInsufficient: 'Public sample for this team is insufficient',
    nextTitle: 'Next title in 1–3 years',
    noSalaryOnPage: 'No dollar salary amounts on this page (see Snapshot / Interview & offer)',
    promotionGaps: 'Core promotion skill gaps',
    downgradeTitle: 'Downgrade rule',
    downgradeNote:
      'If this specific team/role has no public reviews: fall back to same department/level signals, or mark “public sample for this team is insufficient”. Never invent team gossip.',
    page3Of: 'PAGE 3 OF 5',
    page3Title: 'Company truth & risk',
    badgeForumThin: 'Thin forum signal',
    badgeRiskAudit: 'RISK AUDIT',
    currentStrategy: 'Current core strategy (not wiki history)',
    competitors: 'Main competitors (2–3) — strengths & weaknesses',
    strengthLabel: 'Strength:',
    weaknessLabel: 'Weakness:',
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
    tcBreakdown: 'TC mix (Levels.fyi-class sources)',
    tcHint: 'Base + Equity/RSU + Sign-on — market mix for this seat',
    tcBase: 'Base',
    tcRsu: 'Equity/RSU',
    tcSignOn: 'Sign-on',
    negotiateScript: 'Negotiation script (personal context)',
    prepareStep: '1. Prepare (anchor)',
    pitchStep: '2. Personal value pitch',
    counterStep: '3. Counter if rejected',
    behavioralTitle: 'Behavioral (3–5)',
    technicalTitle: 'Technical / case (3–5)',
    predictedBadge: 'Predicted',
    reportedBadge: 'Reported',
    intentLabel: 'Intent: ',
    starLabel: 'STAR outline: ',
    dosDontsLabel: "Do's & Don'ts: ",
    extraReportedTitle: 'Additional reported questions (list only — no full STAR)',
    noExtraReported:
      'No extra reported list — the cards above cover this retrieval. When no reported questions exist, cards are marked Predicted.',
    page5Of: 'PAGE 5 OF 5',
    page5Title: 'References & evidence chain',
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
      'Purpose: keep trust high so you can independently trace original sources.',
    emptyRoleContent: 'Role content not extracted in this run.',
    emptyRequirements: 'Requirements not extracted in this run.',
  },
  'zh-TW': {
    productTitle: '面試策略指南',
    productSubtitle: '快照 + 作戰手冊 — 用上方導覽切換頁面',
    backHome: '回首頁',
    newAnalysis: '重新分析',
    nav: {
      snapshot: { label: '快照', blurb: '一頁適配分數、薪資區間、優勢與缺口。' },
      hiring: {
        label: '職位與團隊',
        blurb: '精練職位/要求、RTO 官方 vs 體感、1–3 年職銜與升遷缺口（無薪資）。',
      },
      interview: {
        label: '公司真相',
        blurb: '當前戰略、競爭對手、內部聲響、Layoff/訴訟與反問題。',
      },
      salary: {
        label: '面試與談薪',
        blurb: '3–5 行為/專業題 STAR、TC（Base/RSU/Sign-on）、談薪腳本。',
      },
      provenance: {
        label: '證據鏈',
        blurb: 'RAG 原始連結；無 URL 則給手動查證關鍵字，絕不假網址。',
      },
    },
    page2Of: '第 2 / 5 頁',
    page2Title: '職位與團隊現況',
    badgeSampleThin: '樣本不足',
    badgeTeamSignals: '團隊訊號',
    roleContent: '職位內容（重構精練）',
    roleContentHint: '嚴禁照抄 JD 原文',
    requirements: '要求條件（重構精練）',
    rtoOfficial: '工作型態 / RTO（官方）',
    rtoOfficialSource: '來源：JD / Company Career Page',
    rtoReality: '真實體感（加班 / WLB）',
    rtoRealitySource: '來源：LinkedIn / Glassdoor / 論壇（非官方 PR）',
    teamSampleInsufficient: '該團隊公開樣本不足',
    nextTitle: '1–3 年下一階段職銜',
    noSalaryOnPage: '嚴禁出現任何具體薪資金額（薪資見快照 / 面試與談薪）',
    promotionGaps: '升遷核心能力缺口',
    downgradeTitle: '降級說明',
    downgradeNote:
      '若該特定 Team/職位在網路上無公開評價：降級為同部門/同職等整體風向，或標註「該團隊公開樣本不足」。不得編造團隊八卦。',
    page3Of: '第 3 / 5 頁',
    page3Title: '公司真相與風險',
    badgeForumThin: '論壇聲量少',
    badgeRiskAudit: '風險稽核',
    currentStrategy: '當前核心戰略（非維基歷史）',
    competitors: '主要競爭對手（2–3）與競合優劣勢',
    strengthLabel: '優：',
    weaknessLabel: '劣：',
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
    tcBreakdown: 'TC 結構拆解（Levels.fyi 等）',
    tcHint: 'Base + 股票/RSU + Sign-on — 市場行情占比',
    tcBase: 'Base 底薪',
    tcRsu: '股票/RSU',
    tcSignOn: 'Sign-on 簽約金',
    negotiateScript: '談薪腳本（個人 Context）',
    prepareStep: '1. 談薪前準備（錨定點）',
    pitchStep: '2. 個人價值 Pitch',
    counterStep: '3. 被拒時 Counter',
    behavioralTitle: '行為題 Behavioral（3–5）',
    technicalTitle: '專業/案例題 Technical/Case（3–5）',
    predictedBadge: '猜題',
    reportedBadge: '真題',
    intentLabel: '考察意圖：',
    starLabel: 'STAR 大綱：',
    dosDontsLabel: "Do's & Don'ts：",
    extraReportedTitle: '其餘真實面試題清單（僅列出，不逐題 STAR）',
    noExtraReported: '無額外真題清單 — 上方精選題已涵蓋本輪檢索結果。找不到真題時已標「猜題」。',
    page5Of: '第 5 / 5 頁',
    page5Title: '參考資料與證據鏈',
    ragCount: 'RAG 引用條數',
    ragSourcesHint: 'Reddit/Blind 討論串、Levels.fyi、Layoff、新聞等原始連結',
    invalidLinkTitle: '無效連結處理',
    invalidLinkBody: '若 RAG 檢索不到直接 URL：寫明「檢索數據摘要與建議手動查證關鍵字」，',
    neverFakeUrl: '絕不填充假網址。',
    webReferences: '網路資訊與參考資料',
    noDirectUrl: '無直接 URL — 請手動查證',
    manualVerifyPrefix: '檢索數據摘要與建議手動查證關鍵字：',
    noDirectLinkParen: '（無直接連結）',
    provenanceFooter: '定位：確保可信度，讓求職者可自主深度追蹤原始來源。',
    emptyRoleContent: '本次未抽出職位內容。',
    emptyRequirements: '本次未抽出要求條件。',
  },
  'zh-CN': {
    productTitle: '面试策略指南',
    productSubtitle: '快照 + 作战手册 — 用上方导航切换页面',
    backHome: '回首页',
    newAnalysis: '重新分析',
    nav: {
      snapshot: { label: '快照', blurb: '一页适配分数、薪酬区间、优势与缺口。' },
      hiring: {
        label: '职位与团队',
        blurb: '精炼职位/要求、RTO 官方 vs 体感、1–3 年职衔与晋升缺口（无薪酬）。',
      },
      interview: {
        label: '公司真相',
        blurb: '当前战略、竞争对手、内部声响、Layoff/诉讼与反问题。',
      },
      salary: {
        label: '面试与谈薪',
        blurb: '3–5 行为/专业题 STAR、TC（Base/RSU/Sign-on）、谈薪脚本。',
      },
      provenance: {
        label: '证据链',
        blurb: 'RAG 原始链接；无 URL 则给手动查证关键词，绝不假网址。',
      },
    },
    page2Of: '第 2 / 5 页',
    page2Title: '职位与团队现况',
    badgeSampleThin: '样本不足',
    badgeTeamSignals: '团队信号',
    roleContent: '职位内容（重构精炼）',
    roleContentHint: '严禁照抄 JD 原文',
    requirements: '要求条件（重构精炼）',
    rtoOfficial: '工作形态 / RTO（官方）',
    rtoOfficialSource: '来源：JD / Company Career Page',
    rtoReality: '真实体感（加班 / WLB）',
    rtoRealitySource: '来源：LinkedIn / Glassdoor / 论坛（非官方 PR）',
    teamSampleInsufficient: '该团队公开样本不足',
    nextTitle: '1–3 年下一阶段职衔',
    noSalaryOnPage: '严禁出现任何具体薪酬金额（薪酬见快照 / 面试与谈薪）',
    promotionGaps: '晋升核心能力缺口',
    downgradeTitle: '降级说明',
    downgradeNote:
      '若该特定 Team/职位在网上无公开评价：降级为同部门/同职等整体风向，或标注「该团队公开样本不足」。不得编造团队八卦。',
    page3Of: '第 3 / 5 页',
    page3Title: '公司真相与风险',
    badgeForumThin: '论坛声量少',
    badgeRiskAudit: '风险稽核',
    currentStrategy: '当前核心战略（非维基历史）',
    competitors: '主要竞争对手（2–3）与竞合优劣势',
    strengthLabel: '优：',
    weaknessLabel: '劣：',
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
    tcBreakdown: 'TC 结构拆解（Levels.fyi 等）',
    tcHint: 'Base + 股票/RSU + Sign-on — 市场行情占比',
    tcBase: 'Base 底薪',
    tcRsu: '股票/RSU',
    tcSignOn: 'Sign-on 签约金',
    negotiateScript: '谈薪脚本（个人 Context）',
    prepareStep: '1. 谈薪前准备（锚定点）',
    pitchStep: '2. 个人价值 Pitch',
    counterStep: '3. 被拒时 Counter',
    behavioralTitle: '行为题 Behavioral（3–5）',
    technicalTitle: '专业/案例题 Technical/Case（3–5）',
    predictedBadge: '猜题',
    reportedBadge: '真题',
    intentLabel: '考察意图：',
    starLabel: 'STAR 大纲：',
    dosDontsLabel: "Do's & Don'ts：",
    extraReportedTitle: '其余真实面试题清单（仅列出，不逐题 STAR）',
    noExtraReported: '无额外真题清单 — 上方精选题已涵盖本轮检索结果。找不到真题时已标「猜题」。',
    page5Of: '第 5 / 5 页',
    page5Title: '参考资料与证据链',
    ragCount: 'RAG 引用条数',
    ragSourcesHint: 'Reddit/Blind 讨论串、Levels.fyi、Layoff、新闻等原始链接',
    invalidLinkTitle: '无效链接处理',
    invalidLinkBody: '若 RAG 检索不到直接 URL：写明「检索数据摘要与建议手动查证关键词」，',
    neverFakeUrl: '绝不填充假网址。',
    webReferences: '网络信息与参考资料',
    noDirectUrl: '无直接 URL — 请手动查证',
    manualVerifyPrefix: '检索数据摘要与建议手动查证关键词：',
    noDirectLinkParen: '（无直接链接）',
    provenanceFooter: '定位：确保可信度，让求职者可自主深度追踪原始来源。',
    emptyRoleContent: '本次未抽出职位内容。',
    emptyRequirements: '本次未抽出要求条件。',
  },
  es: {
    productTitle: 'Guía de estrategia de entrevista',
    productSubtitle: 'Snapshot + playbook — cambia de página en la navegación superior',
    backHome: 'Volver al inicio',
    newAnalysis: 'Nuevo análisis',
    nav: {
      snapshot: {
        label: 'Snapshot',
        blurb: 'Puntuación, rango salarial, fortalezas y brechas en una página.',
      },
      hiring: {
        label: 'Rol y equipo',
        blurb: 'Rol/requisitos refinados, RTO oficial vs realidad, título 1–3 años y gaps (sin salario).',
      },
      interview: {
        label: 'Verdad de la empresa',
        blurb: 'Estrategia actual, competidores, voz interna, layoffs/legal y preguntas inversas.',
      },
      salary: {
        label: 'Entrevista y oferta',
        blurb: '3–5 STAR conductuales/técnicas, TC (Base/RSU/Sign-on), guion de negociación.',
      },
      provenance: {
        label: 'Cadena de evidencia',
        blurb: 'Enlaces RAG; sin URL → keywords de verificación manual — nunca URLs falsas.',
      },
    },
    page2Of: 'PÁGINA 2 DE 5',
    page2Title: 'Rol y realidad del equipo',
    badgeSampleThin: 'Muestra insuficiente',
    badgeTeamSignals: 'SEÑALES DEL EQUIPO',
    roleContent: 'Contenido del rol (refinado)',
    roleContentHint: 'Nunca pegues el JD literal',
    requirements: 'Requisitos (refinados)',
    rtoOfficial: 'Modalidad / RTO (oficial)',
    rtoOfficialSource: 'Fuente: JD / página de carreras',
    rtoReality: 'Realidad de empleados (OT / WLB)',
    rtoRealitySource: 'Fuente: LinkedIn / Glassdoor / foros (no PR oficial)',
    teamSampleInsufficient: 'Muestra pública insuficiente para este equipo',
    nextTitle: 'Siguiente título en 1–3 años',
    noSalaryOnPage: 'Sin montos salariales en esta página (ver Snapshot / Entrevista y oferta)',
    promotionGaps: 'Gaps clave para promoción',
    downgradeTitle: 'Regla de degradación',
    downgradeNote:
      'Si no hay reseñas públicas de este equipo/rol: degrada a señales del mismo departamento/nivel, o marca “muestra pública insuficiente”. No inventes chismes.',
    page3Of: 'PÁGINA 3 DE 5',
    page3Title: 'Verdad y riesgo de la empresa',
    badgeForumThin: 'Poco señal en foros',
    badgeRiskAudit: 'AUDITORÍA DE RIESGO',
    currentStrategy: 'Estrategia actual (no historia wiki)',
    competitors: 'Competidores principales (2–3) — fortalezas y debilidades',
    strengthLabel: 'Fortaleza:',
    weaknessLabel: 'Debilidad:',
    insiderVoice: 'Voz interna (Glassdoor / Blind / Reddit)',
    forumThinBadge: 'Poca señal pública en foros',
    forumThinFallback: 'Poca señal pública en foros — no inventes sentimiento.',
    insiderHint: 'Filtra PR oficial; enfócate en estilo de manager / WLB / tóxico',
    layoffLegal: 'Layoff.fyi / litigios y controversias públicas',
    noLayoffRecord: 'Sin banderas públicas significativas de layoffs/legal',
    strategyQuestions: 'Preguntas de estrategia que puedes hacer',
    strategyQuestionsNote:
      'Si no hay registro público de layoffs/legal, no inventes — escribe 2–3 preguntas de estrategia.',
    page4Of: 'PÁGINA 4 DE 5',
    page4Title: 'Estrategia de entrevista y oferta',
    tcBreakdown: 'Mix de TC (fuentes tipo Levels.fyi)',
    tcHint: 'Base + Equity/RSU + Sign-on — mix de mercado',
    tcBase: 'Base',
    tcRsu: 'Equity/RSU',
    tcSignOn: 'Sign-on',
    negotiateScript: 'Guion de negociación (contexto personal)',
    prepareStep: '1. Preparar (ancla)',
    pitchStep: '2. Pitch de valor personal',
    counterStep: '3. Counter si rechazan',
    behavioralTitle: 'Conductuales (3–5)',
    technicalTitle: 'Técnicas / caso (3–5)',
    predictedBadge: 'Predicha',
    reportedBadge: 'Reportada',
    intentLabel: 'Intención: ',
    starLabel: 'Esquema STAR: ',
    dosDontsLabel: "Do's & Don'ts: ",
    extraReportedTitle: 'Otras preguntas reportadas (solo lista — sin STAR completo)',
    noExtraReported:
      'Sin lista extra — las tarjetas de arriba cubren esta búsqueda. Sin reportadas → marcadas Predicha.',
    page5Of: 'PÁGINA 5 DE 5',
    page5Title: 'Referencias y cadena de evidencia',
    ragCount: 'Conteo de citas RAG',
    ragSourcesHint: 'Hilos Reddit/Blind, Levels.fyi, Layoff, noticias — enlaces originales',
    invalidLinkTitle: 'Sin URL directa',
    invalidLinkBody: 'Si RAG no halla URL: resumen de recuperación + keywords de verificación manual.',
    neverFakeUrl: ' Nunca inventes URLs falsas.',
    webReferences: 'Fuentes web y referencias',
    noDirectUrl: 'Sin URL directa — verifica manualmente',
    manualVerifyPrefix: 'Resumen y keywords sugeridas: ',
    noDirectLinkParen: '(sin enlace directo)',
    provenanceFooter: 'Objetivo: mantener confianza para que puedas rastrear fuentes originales.',
    emptyRoleContent: 'No se extrajo contenido del rol en esta ejecución.',
    emptyRequirements: 'No se extrajeron requisitos en esta ejecución.',
  },
  hi: {
    productTitle: 'इंटरव्यू रणनीति गाइड',
    productSubtitle: 'स्नैपशॉट + प्लेबुक — ऊपर के नेव से पेज बदलें',
    backHome: 'होम पर वापस',
    newAnalysis: 'नया विश्लेषण',
    nav: {
      snapshot: {
        label: 'स्नैपशॉट',
        blurb: 'एक पेज फिट स्कोर, ऑफर रेंज, ताकत और गैप।',
      },
      hiring: {
        label: 'रोल और टीम',
        blurb: 'रिफाइंड रोल/आवश्यकताएँ, आधिकारिक RTO बनाम हकीकत, 1–3 वर्ष टाइटल (बिना सैलरी)।',
      },
      interview: {
        label: 'कंपनी सच',
        blurb: 'वर्तमान रणनीति, प्रतिस्पर्धी, अंदरूनी आवाज़, लेऑफ/कानूनी झंडे।',
      },
      salary: {
        label: 'इंटरव्यू और ऑफर',
        blurb: '3–5 बिहेवियरल/टेक्निकल STAR, TC, बातचीत स्क्रिप्ट।',
      },
      provenance: {
        label: 'सबूत श्रृंखला',
        blurb: 'RAG लिंक; URL न हो तो मैन्युअल कीवर्ड — कभी नकली URL नहीं।',
      },
    },
    page2Of: 'पेज 2 / 5',
    page2Title: 'रोल और टीम की हकीकत',
    badgeSampleThin: 'नमूना अपर्याप्त',
    badgeTeamSignals: 'टीम संकेत',
    roleContent: 'रोल सामग्री (रिफाइंड)',
    roleContentHint: 'JD को शब्दशः कॉपी न करें',
    requirements: 'आवश्यकताएँ (रिफाइंड)',
    rtoOfficial: 'कार्य मोड / RTO (आधिकारिक)',
    rtoOfficialSource: 'स्रोत: JD / कंपनी करियर पेज',
    rtoReality: 'कर्मचारी हकीकत (OT / WLB)',
    rtoRealitySource: 'स्रोत: LinkedIn / Glassdoor / फोरम (आधिकारिक PR नहीं)',
    teamSampleInsufficient: 'इस टीम का सार्वजनिक नमूना अपर्याप्त',
    nextTitle: '1–3 वर्षों में अगला टाइटल',
    noSalaryOnPage: 'इस पेज पर कोई डॉलर सैलरी नहीं (स्नैपशॉट / इंटरव्यू देखें)',
    promotionGaps: 'प्रमोशन के मुख्य स्किल गैप',
    downgradeTitle: 'डाउनग्रेड नियम',
    downgradeNote:
      'यदि इस टीम/रोल की कोई सार्वजनिक समीक्षा नहीं: विभाग/लेवल सिग्नल पर जाएँ, या “नमूना अपर्याप्त” चिह्नित करें। अफवाह न गढ़ें।',
    page3Of: 'पेज 3 / 5',
    page3Title: 'कंपनी सच और जोखिम',
    badgeForumThin: 'कम फोरम सिग्नल',
    badgeRiskAudit: 'जोखिम ऑडिट',
    currentStrategy: 'वर्तमान मुख्य रणनीति (विकि इतिहास नहीं)',
    competitors: 'मुख्य प्रतिस्पर्धी (2–3) — ताकत और कमज़ोरी',
    strengthLabel: 'ताकत:',
    weaknessLabel: 'कमज़ोरी:',
    insiderVoice: 'अंदरूनी आवाज़ (Glassdoor / Blind / Reddit)',
    forumThinBadge: 'सार्वजनिक फोरम सिग्नल कम',
    forumThinFallback: 'सार्वजनिक फोरम सिग्नल कम — भावना गढ़ें नहीं।',
    insiderHint: 'आधिकारिक PR छानें; मैनेजर स्टाइल / WLB / toxic पर फोकस',
    layoffLegal: 'Layoff.fyi / सार्वजनिक मुकदमे और विवाद',
    noLayoffRecord: 'कोई महत्वपूर्ण सार्वजनिक लेऑफ/कानूनी झंडा नहीं',
    strategyQuestions: 'साक्षात्कार में पूछने योग्य रणनीति प्रश्न',
    strategyQuestionsNote:
      'यदि कोई सार्वजनिक लेऑफ/कानूनी रिकॉर्ड नहीं — गढ़ें नहीं; 2–3 रणनीति प्रश्न दें।',
    page4Of: 'पेज 4 / 5',
    page4Title: 'इंटरव्यू और ऑफर रणनीति',
    tcBreakdown: 'TC मिश्रण (Levels.fyi-श्रेणी स्रोत)',
    tcHint: 'Base + Equity/RSU + Sign-on — बाज़ार मिश्रण',
    tcBase: 'बेस',
    tcRsu: 'Equity/RSU',
    tcSignOn: 'Sign-on',
    negotiateScript: 'बातचीत स्क्रिप्ट (व्यक्तिगत संदर्भ)',
    prepareStep: '1. तैयारी (एंकर)',
    pitchStep: '2. व्यक्तिगत मूल्य पिच',
    counterStep: '3. अस्वीकार पर काउंटर',
    behavioralTitle: 'बिहेवियरल (3–5)',
    technicalTitle: 'टेक्निकल / केस (3–5)',
    predictedBadge: 'अनुमानित',
    reportedBadge: 'रिपोर्टेड',
    intentLabel: 'इरादा: ',
    starLabel: 'STAR रूपरेखा: ',
    dosDontsLabel: "Do's & Don'ts: ",
    extraReportedTitle: 'अतिरिक्त रिपोर्टेड प्रश्न (केवल सूची)',
    noExtraReported:
      'कोई अतिरिक्त सूची नहीं — ऊपर के कार्ड पर्याप्त हैं। रिपोर्टेड न हों तो Predicted चिह्नित।',
    page5Of: 'पेज 5 / 5',
    page5Title: 'संदर्भ और सबूत श्रृंखला',
    ragCount: 'RAG उद्धरण संख्या',
    ragSourcesHint: 'Reddit/Blind, Levels.fyi, Layoff, समाचार — मूल लिंक',
    invalidLinkTitle: 'URL न होने पर',
    invalidLinkBody: 'यदि सीधा URL न मिले: सारांश + मैन्युअल जाँच कीवर्ड लिखें।',
    neverFakeUrl: ' कभी नकली URL न भरें।',
    webReferences: 'वेब स्रोत और संदर्भ',
    noDirectUrl: 'सीधा URL नहीं — मैन्युअल जाँच करें',
    manualVerifyPrefix: 'सारांश और सुझाए कीवर्ड: ',
    noDirectLinkParen: '(कोई सीधा लिंक नहीं)',
    provenanceFooter: 'उद्देश्य: विश्वास बनाए रखें ताकि आप मूल स्रोत खुद ट्रेस कर सकें।',
    emptyRoleContent: 'इस रन में रोल सामग्री नहीं निकली।',
    emptyRequirements: 'इस रन में आवश्यकताएँ नहीं निकलीं।',
  },
  ar: {
    productTitle: 'دليل استراتيجية المقابلة',
    productSubtitle: 'لقطة + دليل عمل — بدّل الصفحات من الشريط العلوي',
    backHome: 'العودة للرئيسية',
    newAnalysis: 'تحليل جديد',
    nav: {
      snapshot: {
        label: 'اللقطة',
        blurb: 'درجة الملاءمة ونطاق العرض ونقاط القوة والفجوات في صفحة واحدةحدة.',
      },
      hiring: {
        label: 'الدور والفريق',
        blurb: 'دور/متطلبات مُنقّحة، RTO الرسمي مقابل الواقع، لقب 1–3 سنوات (بدون راتب).',
      },
      interview: {
        label: 'حقيقة الشركة',
        blurb: 'الاستراتيجية الحالية والمنافسون والصوت الداخلي وتسريحات/قانوني وأسئلة عكسية.',
      },
      salary: {
        label: 'المقابلة والعرض',
        blurb: '3–5 بطاقات STAR سلوكية/تقنية، TC، وسكربت تفاوض.',
      },
      provenance: {
        label: 'سلسلة الأدلة',
        blurb: 'روابط RAG؛ بلا URL → كلمات تحقق يدوي — لا عناوين وهمية.',
      },
    },
    page2Of: 'الصفحة 2 من 5',
    page2Title: 'واقع الدور والفريق',
    badgeSampleThin: 'عينة غير كافية',
    badgeTeamSignals: 'إشارات الفريق',
    roleContent: 'محتوى الدور (مُنقّح)',
    roleContentHint: 'لا تنسخ وصف الوظيفة حرفيًا',
    requirements: 'المتطلبات (مُنقّحة)',
    rtoOfficial: 'نمط العمل / RTO (رسمي)',
    rtoOfficialSource: 'المصدر: JD / صفحة الوظائف',
    rtoReality: 'واقع الموظفين (ساعات إضافية / توازن)',
    rtoRealitySource: 'المصدر: LinkedIn / Glassdoor / منتديات (ليس PR رسمي)',
    teamSampleInsufficient: 'العينة العامة لهذا الفريق غير كافية',
    nextTitle: 'اللقب التالي خلال 1–3 سنوات',
    noSalaryOnPage: 'لا مبالغ راتب بالدولار في هذه الصفحة (انظر اللقطة / المقابلة والعرض)',
    promotionGaps: 'فجوات مهارات الترقية الأساسية',
    downgradeTitle: 'قاعدة التخفيض',
    downgradeNote:
      'إن لم توجد تقييمات عامة لهذا الفريق/الدور: انزل لإشارات نفس القسم/المستوى، أو علّم «عينة غير كافية». لا تختلق شائعات.',
    page3Of: 'الصفحة 3 من 5',
    page3Title: 'حقيقة الشركة والمخاطر',
    badgeForumThin: 'إشارة منتدى ضعيفة',
    badgeRiskAudit: 'تدقيق المخاطر',
    currentStrategy: 'الاستراتيجية الحالية (ليست تاريخ ويكي)',
    competitors: 'المنافسون الرئيسيون (2–3) — نقاط القوة والضعف',
    strengthLabel: 'قوة:',
    weaknessLabel: 'ضعف:',
    insiderVoice: 'صوت داخلي (Glassdoor / Blind / Reddit)',
    forumThinBadge: 'إشارة عامة ضعيفة في المنتديات',
    forumThinFallback: 'إشارة عامة ضعيفة — لا تختلق مشاعر.',
    insiderHint: 'صفِّ PR الرسمي؛ ركّز على أسلوب المدير / التوازن / السُمّية',
    layoffLegal: 'Layoff.fyi / دعاوى وخلافات عامة',
    noLayoffRecord: 'لا إشارات عامة بارزة لتسريحات/مخاطر قانونية',
    strategyQuestions: 'أسئلة استراتيجية يمكنك طرحها',
    strategyQuestionsNote:
      'إن لم يوجد سجل تسريح/قانوني عام — لا تختلق؛ اكتب 2–3 أسئلة استراتيجية.',
    page4Of: 'الصفحة 4 من 5',
    page4Title: 'استراتيجية المقابلة والعرض',
    tcBreakdown: 'مزيج TC (مصادر بمستوى Levels.fyi)',
    tcHint: 'الأساسي + الأسهم/RSU + Sign-on — مزيج السوق',
    tcBase: 'الأساسي',
    tcRsu: 'أسهم/RSU',
    tcSignOn: 'مكافأة التوقيع',
    negotiateScript: 'سكربت التفاوض (سياق شخصي)',
    prepareStep: '1. التحضير (مرساة)',
    pitchStep: '2. عرض القيمة الشخصية',
    counterStep: '3. الرد عند الرفض',
    behavioralTitle: 'سلوكية (3–5)',
    technicalTitle: 'تقنية / حالة (3–5)',
    predictedBadge: 'مُتوقَّعة',
    reportedBadge: 'مُبلَّغ عنها',
    intentLabel: 'القصد: ',
    starLabel: 'مخطط STAR: ',
    dosDontsLabel: "Do's & Don'ts: ",
    extraReportedTitle: 'أسئلة مُبلَّغ إضافية (قائمة فقط — بلا STAR كامل)',
    noExtraReported:
      'لا قائمة إضافية — البطاقات أعلاه تغطي هذه الجولة. بلا أسئلة مبلّغ → مُعلَّمة مُتوقَّعة.',
    page5Of: 'الصفحة 5 من 5',
    page5Title: 'المراجع وسلسلة الأدلة',
    ragCount: 'عدد اقتباسات RAG',
    ragSourcesHint: 'خيوط Reddit/Blind وLevels.fyi وLayoff والأخبار — روابط أصلية',
    invalidLinkTitle: 'عند غياب الرابط',
    invalidLinkBody: 'إن لم يجد RAG رابطًا مباشرًا: اكتب ملخص الاسترجاع + كلمات تحقق يدوي.',
    neverFakeUrl: ' لا تختلق عناوين وهمية أبدًا.',
    webReferences: 'مصادر الويب والمراجع',
    noDirectUrl: 'لا رابط مباشر — تحقق يدويًا',
    manualVerifyPrefix: 'ملخص الاسترجاع وكلمات التحقق المقترحة: ',
    noDirectLinkParen: '(لا رابط مباشر)',
    provenanceFooter: 'الهدف: الحفاظ على الثقة لتتبع المصادر الأصلية بنفسك.',
    emptyRoleContent: 'لم يُستخرج محتوى الدور في هذا التشغيل.',
    emptyRequirements: 'لم تُستخرج المتطلبات في هذا التشغيل.',
  },
};

export function getSnapshotUiCopy(language?: string | null): SnapshotUiCopy {
  const lang = normalizeReportLanguage(language);
  return SNAPSHOT[lang] ?? SNAPSHOT.en;
}

export function getGuideUiCopy(language?: string | null): GuideUiCopy {
  const lang = normalizeReportLanguage(language);
  return GUIDE[lang] ?? GUIDE.en;
}
