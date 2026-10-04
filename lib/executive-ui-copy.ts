import type {
  AssessmentBasis,
  CompetencyProficiency,
  CompetencyWeight,
  InsiderSignalSource,
  LeverageDirection,
  LeverageStrength,
  RiskCategory,
  RiskSeverity,
  SeniorityAlignment,
} from '@/types';
import { normalizeReportLanguage, type AppLanguage } from '@/lib/report-language';

/** UI labels for the executive-assessment layer (body text comes from the model). */
export interface ExecutiveUiCopy {
  competencyMap: string;
  weight: Record<CompetencyWeight, string>;
  proficiency: Record<CompetencyProficiency, string>;
  noEvidence: string;
  marketPositioning: string;
  alignment: Record<SeniorityAlignment, string>;
  differentiator: string;
  riskAssessment: string;
  severity: Record<RiskSeverity, string>;
  category: Record<RiskCategory, string>;
  basis: Record<AssessmentBasis, string>;
  leverageAnalysis: string;
  leverageStrength: Record<LeverageStrength, string>;
  direction: Record<LeverageDirection, string>;
  bargainingPosture: string;
  noCitation: string;
  insiderSignals: string;
  insiderSource: Record<InsiderSignalSource, string>;
  colSource: string;
  colFinding: string;
  colDate: string;
  colTier: string;
  terminalTitle: string;
}

const EN: ExecutiveUiCopy = {
  competencyMap: 'Competency Map',
  weight: { core: 'Core', supporting: 'Supporting' },
  proficiency: { demonstrated: 'Demonstrated', adjacent: 'Adjacent', absent: 'Absent' },
  noEvidence: 'No resume evidence',
  marketPositioning: 'Market Positioning',
  alignment: {
    under_level: 'Under level',
    at_level: 'At level',
    over_level: 'Over level',
    unclear: 'Unclear',
  },
  differentiator: 'Differentiator',
  riskAssessment: 'Risk Assessment',
  severity: { low: 'Low', medium: 'Medium', high: 'High' },
  category: {
    competency: 'Competency',
    seniority: 'Seniority',
    compensation: 'Compensation',
    eligibility: 'Eligibility',
    role_stability: 'Role stability',
  },
  basis: { resume: 'Resume', jd: 'JD', inferred: 'Inferred' },
  leverageAnalysis: 'Leverage Analysis',
  leverageStrength: { strong: 'Strong', moderate: 'Moderate', weak: 'Weak', unknown: 'Unknown' },
  direction: { for_candidate: 'Candidate', for_employer: 'Employer', neutral: 'Neutral' },
  bargainingPosture: 'Bargaining posture',
  noCitation: 'No citable source',
  insiderSignals: 'Insider Signals',
  insiderSource: {
    h1bdata: 'H-1B filings',
    sec_filing: 'SEC filing',
    blind: 'Blind',
    levels_fyi: 'Levels.fyi',
    other: 'Other',
  },
  colSource: 'Source',
  colFinding: 'Finding',
  colDate: 'Date',
  colTier: 'Tier',
  terminalTitle: 'negotiation — copy-ready scripts',
};

const ZH_TW: ExecutiveUiCopy = {
  competencyMap: '能力對照',
  weight: { core: '核心', supporting: '輔助' },
  proficiency: { demonstrated: '已證明', adjacent: '相鄰經驗', absent: '無證據' },
  noEvidence: '履歷無證據',
  marketPositioning: '市場定位',
  alignment: { under_level: '低於職級', at_level: '符合職級', over_level: '高於職級', unclear: '無法判定' },
  differentiator: '差異化優勢',
  riskAssessment: '風險評估',
  severity: { low: '低', medium: '中', high: '高' },
  category: {
    competency: '能力',
    seniority: '資歷',
    compensation: '薪酬',
    eligibility: '資格',
    role_stability: '職位穩定性',
  },
  basis: { resume: '履歷', jd: 'JD', inferred: '推論' },
  leverageAnalysis: '議價籌碼分析',
  leverageStrength: { strong: '強', moderate: '中等', weak: '弱', unknown: '未知' },
  direction: { for_candidate: '候選人', for_employer: '雇主', neutral: '中性' },
  bargainingPosture: '議價姿態',
  noCitation: '無可引用來源',
  insiderSignals: '內部訊號',
  insiderSource: {
    h1bdata: 'H-1B 申報',
    sec_filing: 'SEC 文件',
    blind: 'Blind',
    levels_fyi: 'Levels.fyi',
    other: '其他',
  },
  colSource: '來源',
  colFinding: '發現',
  colDate: '日期',
  colTier: '等級',
  terminalTitle: '談判 — 可複製腳本',
};

const ZH_CN: ExecutiveUiCopy = {
  competencyMap: '能力对照',
  weight: { core: '核心', supporting: '辅助' },
  proficiency: { demonstrated: '已证明', adjacent: '相邻经验', absent: '无证据' },
  noEvidence: '简历无证据',
  marketPositioning: '市场定位',
  alignment: { under_level: '低于职级', at_level: '符合职级', over_level: '高于职级', unclear: '无法判定' },
  differentiator: '差异化优势',
  riskAssessment: '风险评估',
  severity: { low: '低', medium: '中', high: '高' },
  category: {
    competency: '能力',
    seniority: '资历',
    compensation: '薪酬',
    eligibility: '资格',
    role_stability: '职位稳定性',
  },
  basis: { resume: '简历', jd: 'JD', inferred: '推断' },
  leverageAnalysis: '议价筹码分析',
  leverageStrength: { strong: '强', moderate: '中等', weak: '弱', unknown: '未知' },
  direction: { for_candidate: '候选人', for_employer: '雇主', neutral: '中性' },
  bargainingPosture: '议价姿态',
  noCitation: '无可引用来源',
  insiderSignals: '内部信号',
  insiderSource: {
    h1bdata: 'H-1B 申报',
    sec_filing: 'SEC 文件',
    blind: 'Blind',
    levels_fyi: 'Levels.fyi',
    other: '其他',
  },
  colSource: '来源',
  colFinding: '发现',
  colDate: '日期',
  colTier: '等级',
  terminalTitle: '谈判 — 可复制脚本',
};

const ES: ExecutiveUiCopy = {
  competencyMap: 'Mapa de competencias',
  weight: { core: 'Núcleo', supporting: 'Apoyo' },
  proficiency: { demonstrated: 'Demostrada', adjacent: 'Adyacente', absent: 'Ausente' },
  noEvidence: 'Sin evidencia en el CV',
  marketPositioning: 'Posicionamiento de mercado',
  alignment: {
    under_level: 'Por debajo del nivel',
    at_level: 'En el nivel',
    over_level: 'Por encima del nivel',
    unclear: 'No concluyente',
  },
  differentiator: 'Diferenciador',
  riskAssessment: 'Evaluación de riesgos',
  severity: { low: 'Baja', medium: 'Media', high: 'Alta' },
  category: {
    competency: 'Competencia',
    seniority: 'Seniority',
    compensation: 'Compensación',
    eligibility: 'Elegibilidad',
    role_stability: 'Estabilidad del puesto',
  },
  basis: { resume: 'CV', jd: 'JD', inferred: 'Inferido' },
  leverageAnalysis: 'Análisis de palanca',
  leverageStrength: { strong: 'Fuerte', moderate: 'Moderada', weak: 'Débil', unknown: 'Desconocida' },
  direction: { for_candidate: 'Candidato', for_employer: 'Empleador', neutral: 'Neutral' },
  bargainingPosture: 'Postura negociadora',
  noCitation: 'Sin fuente citable',
  insiderSignals: 'Señales internas',
  insiderSource: {
    h1bdata: 'Registros H-1B',
    sec_filing: 'Documento SEC',
    blind: 'Blind',
    levels_fyi: 'Levels.fyi',
    other: 'Otro',
  },
  colSource: 'Fuente',
  colFinding: 'Hallazgo',
  colDate: 'Fecha',
  colTier: 'Nivel',
  terminalTitle: 'negociación — guiones listos para copiar',
};

const HI: ExecutiveUiCopy = {
  competencyMap: 'कॉम्पिटेंसी मैप',
  weight: { core: 'मुख्य', supporting: 'सहायक' },
  proficiency: { demonstrated: 'प्रमाणित', adjacent: 'संबंधित', absent: 'अनुपस्थित' },
  noEvidence: 'रिज़्यूमे में प्रमाण नहीं',
  marketPositioning: 'मार्केट पोज़िशनिंग',
  alignment: {
    under_level: 'स्तर से नीचे',
    at_level: 'स्तर के अनुरूप',
    over_level: 'स्तर से ऊपर',
    unclear: 'अस्पष्ट',
  },
  differentiator: 'विशिष्ट बढ़त',
  riskAssessment: 'जोखिम आकलन',
  severity: { low: 'कम', medium: 'मध्यम', high: 'उच्च' },
  category: {
    competency: 'योग्यता',
    seniority: 'वरिष्ठता',
    compensation: 'वेतन',
    eligibility: 'पात्रता',
    role_stability: 'भूमिका की स्थिरता',
  },
  basis: { resume: 'रिज़्यूमे', jd: 'JD', inferred: 'अनुमानित' },
  leverageAnalysis: 'लीवरेज विश्लेषण',
  leverageStrength: { strong: 'मज़बूत', moderate: 'मध्यम', weak: 'कमज़ोर', unknown: 'अज्ञात' },
  direction: { for_candidate: 'उम्मीदवार', for_employer: 'नियोक्ता', neutral: 'तटस्थ' },
  bargainingPosture: 'मोलभाव का रुख',
  noCitation: 'उद्धृत योग्य स्रोत नहीं',
  insiderSignals: 'अंदरूनी संकेत',
  insiderSource: {
    h1bdata: 'H-1B फ़ाइलिंग',
    sec_filing: 'SEC फ़ाइलिंग',
    blind: 'Blind',
    levels_fyi: 'Levels.fyi',
    other: 'अन्य',
  },
  colSource: 'स्रोत',
  colFinding: 'निष्कर्ष',
  colDate: 'तारीख़',
  colTier: 'स्तर',
  terminalTitle: 'नेगोशिएशन — कॉपी-रेडी स्क्रिप्ट',
};

const AR: ExecutiveUiCopy = {
  competencyMap: 'خريطة الكفاءات',
  weight: { core: 'أساسية', supporting: 'داعمة' },
  proficiency: { demonstrated: 'مُثبتة', adjacent: 'مجاورة', absent: 'غائبة' },
  noEvidence: 'لا دليل في السيرة',
  marketPositioning: 'التموضع في السوق',
  alignment: {
    under_level: 'دون المستوى',
    at_level: 'بمستوى الوظيفة',
    over_level: 'فوق المستوى',
    unclear: 'غير واضح',
  },
  differentiator: 'عنصر التميّز',
  riskAssessment: 'تقييم المخاطر',
  severity: { low: 'منخفضة', medium: 'متوسطة', high: 'عالية' },
  category: {
    competency: 'الكفاءة',
    seniority: 'الأقدمية',
    compensation: 'التعويض',
    eligibility: 'الأهلية',
    role_stability: 'استقرار الوظيفة',
  },
  basis: { resume: 'السيرة', jd: 'الوصف الوظيفي', inferred: 'مستنتج' },
  leverageAnalysis: 'تحليل النفوذ التفاوضي',
  leverageStrength: { strong: 'قوي', moderate: 'متوسط', weak: 'ضعيف', unknown: 'غير معروف' },
  direction: { for_candidate: 'المرشح', for_employer: 'صاحب العمل', neutral: 'محايد' },
  bargainingPosture: 'موقف التفاوض',
  noCitation: 'لا مصدر قابل للاستشهاد',
  insiderSignals: 'إشارات من الداخل',
  insiderSource: {
    h1bdata: 'سجلات H-1B',
    sec_filing: 'وثيقة SEC',
    blind: 'Blind',
    levels_fyi: 'Levels.fyi',
    other: 'أخرى',
  },
  colSource: 'المصدر',
  colFinding: 'النتيجة',
  colDate: 'التاريخ',
  colTier: 'المستوى',
  terminalTitle: 'التفاوض — نصوص جاهزة للنسخ',
};

const EXECUTIVE_UI_COPY: Record<AppLanguage, ExecutiveUiCopy> = {
  en: EN,
  'zh-TW': ZH_TW,
  'zh-CN': ZH_CN,
  es: ES,
  hi: HI,
  ar: AR,
};

export function getExecutiveUiCopy(language?: string | null): ExecutiveUiCopy {
  return EXECUTIVE_UI_COPY[normalizeReportLanguage(language)] ?? EN;
}
