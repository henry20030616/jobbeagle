'use client';

import React from 'react';
import { AppLanguage } from '@/lib/language-context';

export const SafeContentList = ({
  content,
  bulletColor = 'bg-jb-ink-subtle',
  textColor = 'text-jb-ink',
}: {
  content: unknown;
  bulletColor?: string;
  textColor?: string;
}) => {
  if (!content) return null;

  let items: unknown[] = [];
  if (Array.isArray(content)) {
    items = content;
  } else if (typeof content === 'string') {
    items = content.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
  } else {
    items = [content];
  }

  if (items.length === 0) return null;

  return (
    <ul className="mt-2 space-y-3">
      {items.map((item, idx) => {
        let mainText = '';
        let subText = '';

        if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, string>;
          mainText = obj.point || obj.gap || obj.name || obj.question || JSON.stringify(item);
          subText = obj.description || obj.strengths || obj.answer_guide || '';
        } else {
          mainText = String(item).replace(/^[\d.\-•*\s]+/, '');
        }

        if (mainText === '[object Object]') return null;

        return (
          <li key={idx} className="flex items-start text-left">
            <span className={`mt-2 mr-3 h-1.5 w-1.5 shrink-0 rounded-full ${bulletColor} opacity-80`} />
            <div className="flex-1">
              <div className={`text-sm font-medium leading-relaxed ${textColor}`}>{mainText}</div>
              {subText && <div className="mt-1 text-xs text-jb-ink-muted">{subText}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export const cleanText = (text: string | unknown): string => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  return text.replace(/\*\*/g, '').replace(/\[\d+(,\s*\d+)*\]/g, '');
};

export const BeagleIcon = ({
  className,
  color = '#71717a',
  spotColor = '#5d4037',
  bellyColor = '#5d4037',
}: {
  className?: string;
  color?: string;
  spotColor?: string;
  bellyColor?: string;
}) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 65 C30 75 30 85 35 90 C40 95 60 95 65 90 C70 85 70 75 65 65" fill="currentColor" stroke={color} strokeWidth="1.5" />
    <path d="M40 70 Q50 65 60 70 L62 85 Q50 90 38 85 Z" fill="#f5f5f5" />
    <ellipse cx="50" cy="80" rx="8" ry="4" fill={bellyColor} opacity="0.3" />
    <path d="M50 20 C65 20 75 30 75 45 C75 55 65 65 50 65 C35 65 25 55 25 45 C25 30 35 20 50 20Z" fill="currentColor" stroke={color} strokeWidth="2" />
    <path d="M28 28 C20 30 15 45 15 55 C15 65 22 70 28 65" fill={spotColor} stroke={color} strokeWidth="1.5" />
    <path d="M72 28 C80 30 85 45 85 55 C85 65 78 70 72 65" fill={spotColor} stroke={color} strokeWidth="1.5" />
    <circle cx="58" cy="40" r="8" stroke={color} strokeWidth="1.5" fill="rgba(255,255,255,0.2)" />
    <path d="M64 46 L82 50" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="42" cy="40" r="3" fill="#333" />
    <circle cx="58" cy="40" r="3" fill="#333" />
    <ellipse cx="50" cy="46" rx="4" ry="2.5" fill="#000" />
  </svg>
);

const SCORE_TIERS: Record<AppLanguage, [string, string, string][]> = {
  'zh-TW': [['鑽石米格魯', '頂級契合：具備即戰力', '您的技能與經驗幾乎完美契合職位需求。'], ['黃金米格魯', '高度契合：具備核心潛力', '您具備大部分核心技能，只需稍作準備。'], ['白銀米格魯', '中度契合：部分技能重疊', '您具備相關基礎，但需強調潛力。'], ['青銅米格魯', '低度契合：建議重新評估', '目前履歷與職位需求差異較大。']],
  'zh-CN': [['钻石猎犬', '顶级契合：具备即战力', '您的技能与经验几乎完美契合职位需求。'], ['黄金猎犬', '高度契合：具备核心潜力', '您具备大部分核心技能，只需稍作准备。'], ['白银猎犬', '中度契合：部分技能重叠', '您具备相关基础，但需强调潜力。'], ['青铜猎犬', '低度契合：建议重新评估', '目前简历与职位需求差异较大。']],
  en: [['Diamond Beagle', 'Top Match: Ready to Execute', 'Your skills and experience almost perfectly match the job requirements.'], ['Gold Beagle', 'High Match: Core Potential', 'You have most of the core skills and only need slight preparation.'], ['Silver Beagle', 'Moderate Match: Partial Skill Overlap', 'You have relevant foundations but need to emphasize potential.'], ['Bronze Beagle', 'Low Match: Re-evaluation Recommended', 'There is a significant gap between your resume and job requirements.']],
  es: [['Beagle Diamante', 'Coincidencia Máxima: Listo para Actuar', 'Tus habilidades y experiencia casi perfectamente coinciden con los requisitos.'], ['Beagle Dorado', 'Alta Coincidencia: Potencial Sólido', 'Tienes la mayoría de las habilidades clave y solo necesitas pequeña preparación.'], ['Beagle Plateado', 'Coincidencia Moderada: Habilidades Parciales', 'Tienes bases relevantes pero debes enfatizar tu potencial.'], ['Beagle Bronce', 'Baja Coincidencia: Se Recomienda Re-evaluación', 'Hay una brecha significativa entre tu CV y los requisitos.']],
  hi: [['डायमंड बीगल', 'शीर्ष मिलान: तैयार', 'आपके कौशल और अनुभव लगभग पूरी तरह से नौकरी की आवश्यकताओं से मेल खाते हैं।'], ['गोल्ड बीगल', 'उच्च मिलान: मूल क्षमता', 'आपके पास अधिकांश मुख्य कौशल हैं और थोड़ी तैयारी की जरूरत है।'], ['सिल्वर बीगल', 'मध्यम मिलान: आंशिक कौशल', 'आपके पास प्रासंगिक आधार है लेकिन क्षमता पर जोर देना होगा।'], ['ब्रॉन्ज़ बीगल', 'कम मिलान: पुनः मूल्यांकन की सलाह', 'आपके CV और नौकरी की आवश्यकताओं के बीच महत्वपूर्ण अंतर है।']],
  ar: [['بيغل ماسي', 'توافق ممتاز: جاهز للتنفيذ', 'مهاراتك وخبرتك تتطابقان تقريبًا بشكل مثالي مع متطلبات الوظيفة.'], ['بيغل ذهبي', 'توافق عالٍ: إمكانات قوية', 'لديك معظم المهارات الأساسية وتحتاج فقط إلى استعداد بسيط.'], ['بيغل فضي', 'توافق متوسط: تداخل جزئي في المهارات', 'لديك أساس مناسب لكن عليك إبراز إمكاناتك بشكل أفضل.'], ['بيغل برونزي', 'توافق منخفض: يُنصح بإعادة التقييم', 'هناك فجوة واضحة بين سيرتك الذاتية ومتطلبات الوظيفة.']],
};

export const getScoreInfo = (score: number, language: AppLanguage = 'en') => {
  const tiers = SCORE_TIERS[language] ?? SCORE_TIERS.en;
  const [level, label, description] = score >= 90 ? tiers[0] : score >= 75 ? tiers[1] : score >= 60 ? tiers[2] : tiers[3];
  const colorMap = {
    0: { color: 'text-cyan-600', fill: '#0891b2', spotColor: '#0e7490' },
    1: { color: 'text-amber-600', fill: '#d97706', spotColor: '#b45309' },
    2: { color: 'text-zinc-500', fill: '#71717a', spotColor: '#52525b' },
    3: { color: 'text-orange-600', fill: '#ea580c', spotColor: '#9a3412' },
  } as const;
  const ci = score >= 90 ? 0 : score >= 75 ? 1 : score >= 60 ? 2 : 3;
  const { color, fill, spotColor } = colorMap[ci];
  const icon = <BeagleIcon className="h-28 w-28 md:h-32 md:w-32" color={fill} spotColor={spotColor} />;
  return { level, label, description, color, fill, icon, tierIndex: ci };
};

export type DashT = {
  matchAnalysis: string;
  coreAdvantages: string;
  skillGaps: string;
  salaryInfo: string;
  estimatedSalary: string;
  analysisLogic: string;
  negotiationStrategy: string;
  workplaceEcology: string;
  companyCulture: string;
  pros: string;
  cons: string;
  interviewProcess: string;
  companyAnalysis: string;
  industryOverview: string;
  industryTrends: string;
  coreMoats: string;
  strategicRisks: string;
  competitors: string;
  strengths: string;
  weaknesses: string;
  interviewPrep: string;
  scoreStandard: string;
  topMatch: string;
  highMatch: string;
  moderateMatch: string;
  lowMatch: string;
  recruiterInsight: string;
  mockInterview: string;
};

const _dashEn: DashT = {
  matchAnalysis: 'Match Score',
  coreAdvantages: 'Core Advantages',
  skillGaps: 'Skill Gaps',
  salaryInfo: 'Salary Intelligence',
  estimatedSalary: 'Estimated Salary',
  analysisLogic: 'Analysis Logic',
  negotiationStrategy: 'Negotiation Strategy',
  workplaceEcology: 'Workplace & Interview Intel',
  companyCulture: 'Culture & Atmosphere',
  pros: 'Pros',
  cons: 'Cons',
  interviewProcess: 'Interview Process',
  companyAnalysis: 'Company & Market',
  industryOverview: 'Industry Overview',
  industryTrends: 'Industry Trends',
  coreMoats: 'Competitive Moats',
  strategicRisks: 'Strategic Risks',
  competitors: 'Competitors',
  strengths: 'Strengths',
  weaknesses: 'Weaknesses',
  interviewPrep: 'Interview Prep',
  scoreStandard: 'Scoring',
  topMatch: 'Top Match',
  highMatch: 'High Match',
  moderateMatch: 'Moderate',
  lowMatch: 'Low Match',
  recruiterInsight: 'Recruiter Insight',
  mockInterview: 'Mock Interview',
};

export const dashTranslations: Record<AppLanguage, DashT> = {
  'zh-TW': { ..._dashEn, matchAnalysis: '職位匹配', coreAdvantages: '核心優勢', skillGaps: '待補強', salaryInfo: '薪資情報', estimatedSalary: '預估薪酬', analysisLogic: '推估邏輯', negotiationStrategy: '談判策略', workplaceEcology: '職場與面試情報', companyCulture: '組織文化', pros: '優點', cons: '缺點', interviewProcess: '面試流程', companyAnalysis: '公司與市場', industryOverview: '產業概況', industryTrends: '產業趨勢', coreMoats: '核心護城河', strategicRisks: '戰略風險', competitors: '競爭對手', strengths: '優勢', weaknesses: '弱點', interviewPrep: '面試準備', scoreStandard: '評分標準', topMatch: '頂級契合', highMatch: '高度契合', moderateMatch: '中度契合', lowMatch: '低度契合', recruiterInsight: '人資洞察', mockInterview: '模擬面試' },
  'zh-CN': { ..._dashEn, matchAnalysis: '职位匹配', coreAdvantages: '核心优势', skillGaps: '待补强', salaryInfo: '薪资情报', estimatedSalary: '预估薪酬', analysisLogic: '推估逻辑', negotiationStrategy: '谈判策略', workplaceEcology: '职场与面试情报', companyCulture: '组织文化', pros: '优点', cons: '缺点', interviewProcess: '面试流程', companyAnalysis: '公司与市场', industryOverview: '产业概况', industryTrends: '产业趋势', coreMoats: '核心护城河', strategicRisks: '战略风险', competitors: '竞争对手', strengths: '优势', weaknesses: '弱点', interviewPrep: '面试准备', scoreStandard: '评分标准', topMatch: '顶级契合', highMatch: '高度契合', moderateMatch: '中度契合', lowMatch: '低度契合', recruiterInsight: '人资洞察', mockInterview: '模拟面试' },
  en: _dashEn,
  es: { ..._dashEn, matchAnalysis: 'Coincidencia', coreAdvantages: 'Ventajas', skillGaps: 'Brechas', salaryInfo: 'Inteligencia Salarial', estimatedSalary: 'Salario Estimado', analysisLogic: 'Lógica', negotiationStrategy: 'Negociación', workplaceEcology: 'Inteligencia Laboral', companyCulture: 'Cultura', pros: 'Pros', cons: 'Contras', interviewProcess: 'Proceso', companyAnalysis: 'Empresa y Mercado', industryOverview: 'Industria', industryTrends: 'Tendencias', coreMoats: 'Ventajas', strategicRisks: 'Riesgos', competitors: 'Competidores', strengths: 'Fortalezas', weaknesses: 'Debilidades', interviewPrep: 'Entrevista', scoreStandard: 'Puntuación', topMatch: 'Máxima', highMatch: 'Alta', moderateMatch: 'Moderada', lowMatch: 'Baja', recruiterInsight: 'Insight RR.HH.', mockInterview: 'Simulación' },
  hi: { ..._dashEn, matchAnalysis: 'मिलान', coreAdvantages: 'लाभ', skillGaps: 'अंतराल', salaryInfo: 'वेतन', estimatedSalary: 'अनुमानित वेतन', analysisLogic: 'तर्क', negotiationStrategy: 'वार्ता', workplaceEcology: 'कार्यस्थल जानकारी', companyCulture: 'संस्कृति', pros: 'लाभ', cons: 'हानि', interviewProcess: 'प्रक्रिया', companyAnalysis: 'कंपनी और बाजार', industryOverview: 'उद्योग', industryTrends: 'रुझान', coreMoats: 'लाभ', strategicRisks: 'जोखिम', competitors: 'प्रतिस्पर्धी', strengths: 'ताकत', weaknesses: 'कमजोरियां', interviewPrep: 'साक्षात्कार', scoreStandard: 'स्कोर', topMatch: 'शीर्ष', highMatch: 'उच्च', moderateMatch: 'मध्यम', lowMatch: 'कम', recruiterInsight: 'भर्ती अंतर्दृष्टि', mockInterview: 'मॉक' },
  ar: { ..._dashEn, matchAnalysis: 'التوافق', coreAdvantages: 'المزايا', skillGaps: 'الفجوات', salaryInfo: 'الراتب', estimatedSalary: 'الراتب المتوقع', analysisLogic: 'المنطق', negotiationStrategy: 'التفاوض', workplaceEcology: 'بيئة العمل', companyCulture: 'الثقافة', pros: 'الإيجابيات', cons: 'السلبيات', interviewProcess: 'المقابلة', companyAnalysis: 'الشركة والسوق', industryOverview: 'القطاع', industryTrends: 'الاتجاهات', coreMoats: 'المزايا', strategicRisks: 'المخاطر', competitors: 'المنافسون', strengths: 'نقاط القوة', weaknesses: 'نقاط الضعف', interviewPrep: 'التحضير', scoreStandard: 'التقييم', topMatch: 'ممتاز', highMatch: 'عالٍ', moderateMatch: 'متوسط', lowMatch: 'منخفض', recruiterInsight: 'رؤية مسؤول التوظيف', mockInterview: 'تجريبي' },
};

export { SCORE_TIERS };
