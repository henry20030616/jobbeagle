'use client';

import React, { useRef } from 'react';
import { InterviewReport } from '@/types';
import { 
  CheckCircle2, AlertTriangle, Target, Zap, 
  Activity, Globe, Building2, Users, FileQuestion
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { AppLanguage } from '@/lib/language-context';

interface DashboardProps {
  data: InterviewReport;
  language?: AppLanguage;
}

// ----------------------------------------------------------------------
// 通用列表元件：處理各種格式的列表內容
// ----------------------------------------------------------------------
const SafeContentList = ({ content, bulletColor = "bg-slate-500", textColor = "text-slate-300" }: { content: any, bulletColor?: string, textColor?: string }) => {
  if (!content) return null;
  
  let items: any[] = [];
  if (Array.isArray(content)) {
    items = content;
  } else if (typeof content === 'string') {
    items = content.split('\n').map(s => s.trim()).filter(s => s.length > 0);
  } else {
    items = [content];
  }

  if (items.length === 0) return null;

  return (
    <ul className="space-y-3 mt-2">
      {items.map((item, idx) => {
        // 智慧判斷：解決 [object Object]
        let mainText = "";
        let subText = "";

        if (typeof item === 'object' && item !== null) {
          mainText = item.point || item.gap || item.name || item.question || JSON.stringify(item);
          subText = item.description || item.strengths || item.answer_guide || "";
        } else {
          mainText = String(item).replace(/^[\d\.\-\•\*\s]+/, '');
        }

        if (mainText === '[object Object]') return null;

        return (
          <li key={idx} className="flex items-start text-left">
            <span className={`mt-2 mr-3 w-1.5 h-1.5 rounded-full ${bulletColor} shrink-0 opacity-80`} />
            <div className="flex-1">
                <div className={`text-sm font-bold ${textColor} leading-relaxed`}>{mainText}</div>
                {subText && <div className="text-xs mt-1 text-slate-500">{subText}</div>}
            </div>
        </li>
        );
      })}
    </ul>
  );
};

const cleanText = (text: string | any): string => {
  if (!text) return '';
  if (typeof text !== 'string') return String(text);
  return text.replace(/\*\*/g, '').replace(/\[\d+(,\s*\d+)*\]/g, '');
};

export const BeagleIcon = ({ className, color = "#475569", spotColor = "#5d4037", bellyColor = "#5d4037" }: any) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 65 C30 75 30 85 35 90 C40 95 60 95 65 90 C70 85 70 75 65 65" fill={color} stroke={color} strokeWidth="1.5" />
    <path d="M40 70 Q50 65 60 70 L62 85 Q50 90 38 85 Z" fill="#f5f5f5" />
    <ellipse cx="50" cy="80" rx="8" ry="4" fill={bellyColor} opacity="0.3" />
    <path d="M50 20 C65 20 75 30 75 45 C75 55 65 65 50 65 C35 65 25 55 25 45 C25 30 35 20 50 20Z" fill={color} stroke={color} strokeWidth="2" />
    <path d="M28 28 C20 30 15 45 15 55 C15 65 22 70 28 65" fill={spotColor} stroke={color} strokeWidth="1.5" />
    <path d="M72 28 C80 30 85 45 85 55 C85 65 78 70 72 65" fill={spotColor} stroke={color} strokeWidth="1.5" />
    <circle cx="58" cy="40" r="8" stroke={color} strokeWidth="1.5" fill="rgba(255,255,255,0.2)" />
    <path d="M64 46 L82 50" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="42" cy="40" r="3" fill="#333" />
    <circle cx="58" cy="40" r="3" fill="#333" />
    <ellipse cx="50" cy="46" rx="4" ry="2.5" fill="#000" />
  </svg>
);

// 生成 SVG HTML 字符串（用於 PDF 版本）
const getBeagleIconSvg = (color: string, spotColor: string, bellyColor: string = "#5d4037", size: string = "64") => {
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block;">
    <path d="M35 65 C30 75 30 85 35 90 C40 95 60 95 65 90 C70 85 70 75 65 65" fill="${color}" stroke="${color}" stroke-width="1.5" />
    <path d="M40 70 Q50 65 60 70 L62 85 Q50 90 38 85 Z" fill="#f5f5f5" />
    <ellipse cx="50" cy="80" rx="8" ry="4" fill="${bellyColor}" opacity="0.3" />
    <path d="M50 20 C65 20 75 30 75 45 C75 55 65 65 50 65 C35 65 25 55 25 45 C25 30 35 20 50 20Z" fill="${color}" stroke="${color}" stroke-width="2" />
    <path d="M28 28 C20 30 15 45 15 55 C15 65 22 70 28 65" fill="${spotColor}" stroke="${color}" stroke-width="1.5" />
    <path d="M72 28 C80 30 85 45 85 55 C85 65 78 70 72 65" fill="${spotColor}" stroke="${color}" stroke-width="1.5" />
    <circle cx="58" cy="40" r="8" stroke="${color}" stroke-width="1.5" fill="rgba(255,255,255,0.2)" />
    <path d="M64 46 L82 50" stroke="${color}" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="42" cy="40" r="3" fill="#333" />
    <circle cx="58" cy="40" r="3" fill="#333" />
    <ellipse cx="50" cy="46" rx="4" ry="2.5" fill="#000" />
  </svg>`;
};

const SCORE_TIERS: Record<AppLanguage, [string, string, string][]> = {
  'zh-TW': [['鑽石米格魯','頂級契合：具備即戰力','您的技能與經驗幾乎完美契合職位需求。'],['黃金米格魯','高度契合：具備核心潛力','您具備大部分核心技能，只需稍作準備。'],['白銀米格魯','中度契合：部分技能重疊','您具備相關基礎，但需強調潛力。'],['青銅米格魯','低度契合：建議重新評估','目前履歷與職位需求差異較大。']],
  'zh-CN': [['钻石猎犬','顶级契合：具备即战力','您的技能与经验几乎完美契合职位需求。'],['黄金猎犬','高度契合：具备核心潜力','您具备大部分核心技能，只需稍作准备。'],['白银猎犬','中度契合：部分技能重叠','您具备相关基础，但需强调潜力。'],['青铜猎犬','低度契合：建议重新评估','目前简历与职位需求差异较大。']],
  en: [['Diamond Beagle','Top Match: Ready to Execute','Your skills and experience almost perfectly match the job requirements.'],['Platinum Beagle','High Match: Core Potential','You have most of the core skills and only need slight preparation.'],['Gold Beagle','Moderate Match: Partial Skill Overlap','You have relevant foundations but need to emphasize potential.'],['Silver Beagle','Low Match: Re-evaluation Recommended','There is a significant gap between your resume and job requirements.']],
  es: [['Beagle Diamante','Coincidencia Máxima: Listo para Actuar','Tus habilidades y experiencia casi perfectamente coinciden con los requisitos.'],['Beagle Dorado','Alta Coincidencia: Potencial Sólido','Tienes la mayoría de las habilidades clave y solo necesitas pequeña preparación.'],['Beagle Plateado','Coincidencia Moderada: Habilidades Parciales','Tienes bases relevantes pero debes enfatizar tu potencial.'],['Beagle Bronce','Baja Coincidencia: Se Recomienda Re-evaluación','Hay una brecha significativa entre tu CV y los requisitos.']],
  hi: [['डायमंड बीगल','शीर्ष मिलान: तैयार','आपके कौशल और अनुभव लगभग पूरी तरह से नौकरी की आवश्यकताओं से मेल खाते हैं।'],['गोल्ड बीगल','उच्च मिलान: मूल क्षमता','आपके पास अधिकांश मुख्य कौशल हैं और थोड़ी तैयारी की जरूरत है।'],['सिल्वर बीगल','मध्यम मिलान: आंशिक कौशल','आपके पास प्रासंगिक आधार है लेकिन क्षमता पर जोर देना होगा।'],['ब्रॉन्ज़ बीगल','कम मिलान: पुनः मूल्यांकन की सलाह','आपके CV और नौकरी की आवश्यकताओं के बीच महत्वपूर्ण अंतर है।']],
  ar: [['بيغل ماسي','توافق ممتاز: جاهز للتنفيذ','مهاراتك وخبرتك تتطابقان تقريبًا بشكل مثالي مع متطلبات الوظيفة.'],['بيغل ذهبي','توافق عالٍ: إمكانات قوية','لديك معظم المهارات الأساسية وتحتاج فقط إلى استعداد بسيط.'],['بيغل فضي','توافق متوسط: تداخل جزئي في المهارات','لديك أساس مناسب لكن عليك إبراز إمكاناتك بشكل أفضل.'],['بيغل برونزي','توافق منخفض: يُنصح بإعادة التقييم','هناك فجوة واضحة بين سيرتك الذاتية ومتطلبات الوظيفة.']],
};

export const getScoreInfo = (score: number, language: AppLanguage = 'en') => {
  const tiers = SCORE_TIERS[language] ?? SCORE_TIERS['en'];
  const [level, label, description] = score >= 90 ? tiers[0] : score >= 75 ? tiers[1] : score >= 60 ? tiers[2] : tiers[3];
  const colorMap = { 0: { color: 'text-cyan-400', fill: '#22d3ee', spotColor: '#0e7490', glow: 'rgba(34,211,238,0.6)' }, 1: { color: 'text-amber-400', fill: '#fbbf24', spotColor: '#b45309', glow: 'rgba(251,191,36,0.6)' }, 2: { color: 'text-slate-300', fill: '#cbd5e1', spotColor: '#475569', glow: 'rgba(203,213,225,0.4)' }, 3: { color: 'text-orange-400', fill: '#fb923c', spotColor: '#9a3412', glow: 'rgba(251,146,60,0.4)' } } as const;
  const ci = score >= 90 ? 0 : score >= 75 ? 1 : score >= 60 ? 2 : 3;
  const { color, fill, spotColor, glow } = colorMap[ci];
  const icon = <BeagleIcon className={`w-32 h-32 drop-shadow-[0_0_${ci < 2 ? '20' : '15'}px_${glow}]`} color={fill} spotColor={spotColor} />;
  return { level, label, description, color, fill, icon };
};

// ----------------------------------------------------------------------
// 3. 主儀表板元件
// ----------------------------------------------------------------------

const AnalysisDashboard: React.FC<DashboardProps> = ({ data, language = 'en' }) => {

  const { basic_analysis, salary_analysis, reviews_analysis, market_analysis, match_analysis, interview_preparation } = data;
  const scoreInfo = getScoreInfo(match_analysis.score, language);
  const tierName = scoreInfo.level;
  const breedArchetype = match_analysis.dog_type;
  const scoreData = [{ name: 'Score', value: match_analysis.score, fill: scoreInfo.fill }];

  // 翻譯對象
  type DT = typeof _dashEn;
  const _dashEn = { matchAnalysis: '1. Job Analysis & Match Score', coreAdvantages: 'Core Advantages', skillGaps: 'Skill Gaps', salaryInfo: '2. Salary Intelligence & Company Reviews', estimatedSalary: 'Estimated Salary (ESTIMATED VALUE)', analysisLogic: 'Analysis & Estimation Logic', negotiationStrategy: 'Negotiation Strategy', workplaceEcology: 'Workplace Ecology & Interview Intelligence', companyCulture: 'Organizational Culture & Atmosphere', pros: 'Pros', cons: 'Cons', interviewProcess: 'Interview Process & Difficulty', realInterviewQuestions: 'Real Interview Questions', sourceLink: 'Source Link', companyAnalysis: '3. Company Overview & Prospect Analysis', industryOverview: 'Industry Overview', industryTrends: 'Industry Trends', coreMoats: 'Core Competitive Moats', strategicRisks: 'Long-term Strategic Risks', competitors: 'Competitors', strengths: 'Strengths', weaknesses: 'Weaknesses', interviewPrep: '4. Interview Questions & Strategy', scoreStandard: 'Scoring Standard', topMatch: 'Top Match', highMatch: 'High Match', moderateMatch: 'Moderate Match', lowMatch: 'Low Match', jobTitle: 'Job Title', generatedDate: 'Generated Date', coreAdvantagesAndGaps: '1. Core Advantages & Gaps', yourAdvantages: 'Your Advantages', suggestedImprovements: 'Suggested Improvements', marketEstimatedSalary: 'Market Estimated Annual Salary', negotiationTips: 'Negotiation Strategy Tips:', industryCompetition: '3. Industry Competition Analysis', mockInterview: '4. Mock Interview Question Bank' };
  const dashTranslations: Record<AppLanguage, DT> = {
    'zh-TW': { matchAnalysis: '1. 職位分析與匹配評分', coreAdvantages: '核心優勢', skillGaps: '待補強項目', salaryInfo: '2. 薪資情報與公司評價', estimatedSalary: '預估薪酬 (ESTIMATED VALUE)', analysisLogic: '分析推估邏輯', negotiationStrategy: '薪資談判策略', workplaceEcology: '職場生態與面試實戰情報', companyCulture: '組織文化與氛圍', pros: '優點', cons: '缺點', interviewProcess: '面試環節與難度', realInterviewQuestions: '真實面試題目', sourceLink: '來源連結', companyAnalysis: '3. 公司介紹與前景分析', industryOverview: '產業概況', industryTrends: '產業趨勢', coreMoats: '企業核心護城河', strategicRisks: '長期戰略風險', competitors: '競爭對手', strengths: '優勢', weaknesses: '弱點', interviewPrep: '4. 面試考題與策略', scoreStandard: '評分標準', topMatch: '頂級契合', highMatch: '高度契合', moderateMatch: '中度契合', lowMatch: '低度契合', jobTitle: '職位', generatedDate: '生成日期', coreAdvantagesAndGaps: '1. 核心優勢與缺口', yourAdvantages: '你的優勢', suggestedImprovements: '建議補強', marketEstimatedSalary: '市場預估年薪', negotiationTips: '談判策略建議：', industryCompetition: '3. 產業競爭分析', mockInterview: '4. 模擬面試題庫' },
    'zh-CN': { matchAnalysis: '1. 职位分析与匹配评分', coreAdvantages: '核心优势', skillGaps: '待补强项目', salaryInfo: '2. 薪资情报与公司评价', estimatedSalary: '预估薪酬 (ESTIMATED VALUE)', analysisLogic: '分析推估逻辑', negotiationStrategy: '薪资谈判策略', workplaceEcology: '职场生态与面试实战情报', companyCulture: '组织文化与氛围', pros: '优点', cons: '缺点', interviewProcess: '面试环节与难度', realInterviewQuestions: '真实面试题目', sourceLink: '来源链接', companyAnalysis: '3. 公司介绍与前景分析', industryOverview: '产业概况', industryTrends: '产业趋势', coreMoats: '企业核心护城河', strategicRisks: '长期战略风险', competitors: '竞争对手', strengths: '优势', weaknesses: '弱点', interviewPrep: '4. 面试考题与策略', scoreStandard: '评分标准', topMatch: '顶级契合', highMatch: '高度契合', moderateMatch: '中度契合', lowMatch: '低度契合', jobTitle: '职位', generatedDate: '生成日期', coreAdvantagesAndGaps: '1. 核心优势与缺口', yourAdvantages: '你的优势', suggestedImprovements: '建议补强', marketEstimatedSalary: '市场预估年薪', negotiationTips: '谈判策略建议：', industryCompetition: '3. 产业竞争分析', mockInterview: '4. 模拟面试题库' },
    en: _dashEn,
    es: { matchAnalysis: '1. Análisis del Puesto y Puntuación', coreAdvantages: 'Ventajas Principales', skillGaps: 'Brechas de Habilidades', salaryInfo: '2. Información Salarial y Reseñas', estimatedSalary: 'Salario Estimado (VALOR ESTIMADO)', analysisLogic: 'Lógica de Análisis y Estimación', negotiationStrategy: 'Estrategia de Negociación', workplaceEcology: 'Ecología Laboral e Inteligencia de Entrevistas', companyCulture: 'Cultura Organizacional y Ambiente', pros: 'Pros', cons: 'Contras', interviewProcess: 'Proceso y Dificultad de Entrevista', realInterviewQuestions: 'Preguntas Reales de Entrevista', sourceLink: 'Enlace de Fuente', companyAnalysis: '3. Visión General de la Empresa y Perspectivas', industryOverview: 'Visión General de la Industria', industryTrends: 'Tendencias de la Industria', coreMoats: 'Ventajas Competitivas Principales', strategicRisks: 'Riesgos Estratégicos a Largo Plazo', competitors: 'Competidores', strengths: 'Fortalezas', weaknesses: 'Debilidades', interviewPrep: '4. Preguntas de Entrevista y Estrategia', scoreStandard: 'Estándar de Puntuación', topMatch: 'Coincidencia Máxima', highMatch: 'Alta Coincidencia', moderateMatch: 'Coincidencia Moderada', lowMatch: 'Baja Coincidencia', jobTitle: 'Puesto', generatedDate: 'Fecha de Generación', coreAdvantagesAndGaps: '1. Ventajas y Brechas Principales', yourAdvantages: 'Tus Ventajas', suggestedImprovements: 'Mejoras Sugeridas', marketEstimatedSalary: 'Salario Anual Estimado del Mercado', negotiationTips: 'Consejos de Negociación Salarial:', industryCompetition: '3. Análisis de Competencia en la Industria', mockInterview: '4. Banco de Preguntas de Entrevista Simulada' },
    hi: { matchAnalysis: '1. नौकरी विश्लेषण और मिलान स्कोर', coreAdvantages: 'मुख्य लाभ', skillGaps: 'कौशल अंतराल', salaryInfo: '2. वेतन जानकारी और कंपनी समीक्षाएं', estimatedSalary: 'अनुमानित वेतन (अनुमानित मूल्य)', analysisLogic: 'विश्लेषण और अनुमान तर्क', negotiationStrategy: 'वेतन वार्ता रणनीति', workplaceEcology: 'कार्यस्थल पारिस्थितिकी और साक्षात्कार जानकारी', companyCulture: 'संगठनात्मक संस्कृति और माहौल', pros: 'लाभ', cons: 'हानि', interviewProcess: 'साक्षात्कार प्रक्रिया और कठिनाई', realInterviewQuestions: 'वास्तविक साक्षात्कार प्रश्न', sourceLink: 'स्रोत लिंक', companyAnalysis: '3. कंपनी अवलोकन और संभावनाएं', industryOverview: 'उद्योग अवलोकन', industryTrends: 'उद्योग के रुझान', coreMoats: 'मुख्य प्रतिस्पर्धात्मक लाभ', strategicRisks: 'दीर्घकालिक रणनीतिक जोखिम', competitors: 'प्रतिस्पर्धी', strengths: 'ताकत', weaknesses: 'कमजोरियां', interviewPrep: '4. साक्षात्कार प्रश्न और रणनीति', scoreStandard: 'स्कोरिंग मानक', topMatch: 'शीर्ष मिलान', highMatch: 'उच्च मिलान', moderateMatch: 'मध्यम मिलान', lowMatch: 'कम मिलान', jobTitle: 'पद', generatedDate: 'उत्पन्न तिथि', coreAdvantagesAndGaps: '1. मुख्य लाभ और अंतराल', yourAdvantages: 'आपके लाभ', suggestedImprovements: 'सुझाए गए सुधार', marketEstimatedSalary: 'बाजार अनुमानित वार्षिक वेतन', negotiationTips: 'वार्ता रणनीति सुझाव:', industryCompetition: '3. उद्योग प्रतिस्पर्धा विश्लेषण', mockInterview: '4. मॉक साक्षात्कार प्रश्न बैंक' },
    ar: { matchAnalysis: '1. تحليل الوظيفة ودرجة التوافق', coreAdvantages: 'المزايا الأساسية', skillGaps: 'فجوات المهارات', salaryInfo: '2. معلومات الراتب ومراجعات الشركة', estimatedSalary: 'الراتب المتوقع (قيمة تقديرية)', analysisLogic: 'منطق التحليل والتقدير', negotiationStrategy: 'استراتيجية التفاوض', workplaceEcology: 'بيئة العمل ومعلومات المقابلات', companyCulture: 'ثقافة المنظمة والأجواء', pros: 'الإيجابيات', cons: 'السلبيات', interviewProcess: 'عملية المقابلة وصعوبتها', realInterviewQuestions: 'أسئلة مقابلة حقيقية', sourceLink: 'رابط المصدر', companyAnalysis: '3. نظرة عامة على الشركة وآفاقها', industryOverview: 'نظرة عامة على القطاع', industryTrends: 'اتجاهات القطاع', coreMoats: 'المزايا التنافسية الأساسية', strategicRisks: 'المخاطر الاستراتيجية طويلة المدى', competitors: 'المنافسون', strengths: 'نقاط القوة', weaknesses: 'نقاط الضعف', interviewPrep: '4. أسئلة المقابلة والاستراتيجية', scoreStandard: 'معيار التقييم', topMatch: 'توافق ممتاز', highMatch: 'توافق عالٍ', moderateMatch: 'توافق متوسط', lowMatch: 'توافق منخفض', jobTitle: 'المسمى الوظيفي', generatedDate: 'تاريخ الإنشاء', coreAdvantagesAndGaps: '1. المزايا والفجوات الأساسية', yourAdvantages: 'مزاياك', suggestedImprovements: 'تحسينات مقترحة', marketEstimatedSalary: 'الراتب السنوي المتوقع في السوق', negotiationTips: 'نصائح استراتيجية التفاوض:', industryCompetition: '3. تحليل المنافسة في القطاع', mockInterview: '4. بنك أسئلة المقابلة التجريبية' },
  };
  const t = dashTranslations[language] ?? dashTranslations['en'];

  return (
    <div className="relative">
      
      {/* ========================================================= */}
      {/* 分析報告主介面 */}
      {/* ========================================================= */}
      <div className="space-y-8 animate-fade-in p-4 md:p-8 max-w-[1440px] mx-auto mb-20">
      
        {/* 1. 職位匹配 (網頁版) */}
      <div className="space-y-6">
        <div className="flex items-center mb-2">
           <span className="w-1.5 h-6 bg-yellow-500 rounded-full mr-3"></span>
           <h2 className="text-xl font-bold text-white">{t.matchAnalysis}</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col items-center relative overflow-hidden">
              <div className="flex items-center justify-center w-full mt-8 mb-8 space-x-8">
               <div className="flex flex-col items-center shrink-0">
                  {scoreInfo.icon}
                  <div className="flex flex-col items-center mt-3">
                    <span className={`text-base font-bold ${scoreInfo.color}`}>{tierName}</span>
                    {breedArchetype && (
                      <span className="text-xs text-slate-500 mt-1">{breedArchetype}</span>
                    )}
                  </div>
               </div>
                 <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={10} data={scoreData} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={30} />
                      </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className={`text-4xl md:text-5xl font-black ${scoreInfo.color}`}>{match_analysis.score}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Score</span>
                  </div>
               </div>
            </div>
            <div className="w-full text-center mb-6">
                <p className={`text-xl font-bold ${scoreInfo.color} mb-1`}>{scoreInfo.label}</p>
                  <p className="text-sm text-slate-400 px-4 leading-relaxed mb-3">{scoreInfo.description}</p>
                  {match_analysis.recruiter_insight && (
                    <p className="text-sm text-slate-300 px-4 leading-relaxed mb-3 text-left border border-slate-600/50 rounded-lg py-2 bg-slate-900/40">
                      <span className="text-xs font-bold text-amber-500/90 uppercase tracking-wide block mb-1">{language === 'zh-TW' ? '人資洞察' : language === 'zh-CN' ? '人资洞察' : 'Recruiter Insight'}</span>
                      {match_analysis.recruiter_insight}
                    </p>
                  )}
                  {/* 分数评等等级说明 */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">{t.scoreStandard}</p>
                    <div className="text-xs text-slate-400 space-y-1 text-left px-4">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400">90+ {SCORE_TIERS[language]?.[0]?.[0] ?? 'Diamond Beagle'}</span>
                        <span className="text-slate-600">{t.topMatch}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400">75+ {SCORE_TIERS[language]?.[1]?.[0] ?? 'Gold Beagle'}</span>
                        <span className="text-slate-600">{t.highMatch}</span>
            </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">60+ {SCORE_TIERS[language]?.[2]?.[0] ?? 'Silver Beagle'}</span>
                        <span className="text-slate-600">{t.moderateMatch}</span>
                  </div>
                      <div className="flex items-center justify-between">
                        <span className="text-orange-400">&lt;60 {SCORE_TIERS[language]?.[3]?.[0] ?? 'Bronze Beagle'}</span>
                        <span className="text-slate-600">{t.lowMatch}</span>
                  </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-700">
              <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> {t.coreAdvantages}
              </h3>
                <SafeContentList content={match_analysis.matching_points} bulletColor="bg-emerald-500" textColor="text-slate-200" />
            </div>
            <div className="flex-1 p-6 bg-slate-800/50">
              <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center uppercase tracking-wide">
                  <AlertTriangle className="w-5 h-5 mr-2" /> {t.skillGaps}
              </h3>
                <SafeContentList content={match_analysis.skill_gaps} bulletColor="bg-amber-500" textColor="text-slate-200" />
            </div>
          </div>
        </div>
      </div>

        {/* 2. 薪資 (網頁版) */}
        {salary_analysis && (
      <div className="space-y-6">
         <div className="flex items-center mb-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
            <h2 className="text-xl font-bold text-white">{t.salaryInfo}</h2>
         </div>
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
                 {/* 預估薪酬與談判策略 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                        <h4 className="text-emerald-400 font-bold mb-4 flex items-center"><Target className="w-4 h-4 mr-2" /> {t.estimatedSalary}</h4>
                           <span className="text-2xl font-black text-white">{cleanText(salary_analysis.estimated_range)}</span>
                        <div className="mt-4">
                          <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">{t.analysisLogic}</p>
                          <SafeContentList content={salary_analysis.rationale} bulletColor="bg-emerald-500" textColor="text-slate-300"/>
                        </div>
                       </div>
                    <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                        <h4 className="text-emerald-400 font-bold mb-4 flex items-center"><Zap className="w-4 h-4 mr-2" /> {t.negotiationStrategy}</h4>
                        <SafeContentList content={salary_analysis.negotiation_tip} bulletColor="bg-emerald-500" textColor="text-slate-300"/>
                    </div>
                  </div>
                 
                 {/* 職場生態與面試實戰情報 */}
                 {reviews_analysis && (
                   <div className="mt-6 pt-6 border-t border-slate-700/50">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                       <Users className="w-5 h-5 mr-2 text-indigo-400" />
                       {t.workplaceEcology}
                     </h3>
                     
                     {/* 組織文化與氛圍 */}
                     {reviews_analysis.company_reviews && (
                       <div className="mb-6 bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                         <h4 className="text-indigo-400 font-bold mb-3 flex items-center">
                           <Building2 className="w-4 h-4 mr-2" />
                           {t.companyCulture}
                    </h4>
                         <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-3">
                           {cleanText(reviews_analysis.company_reviews.summary)}
                  </div>
                         {reviews_analysis.company_reviews.pros && reviews_analysis.company_reviews.pros.length > 0 && (
                           <div className="mt-3">
                             <p className="text-xs text-emerald-400 mb-2 font-bold">{t.pros}</p>
                             <SafeContentList content={reviews_analysis.company_reviews.pros} bulletColor="bg-emerald-500" textColor="text-slate-300"/>
              </div>
                         )}
                         {reviews_analysis.company_reviews.cons && reviews_analysis.company_reviews.cons.length > 0 && (
                           <div className="mt-3">
                             <p className="text-xs text-rose-400 mb-2 font-bold">{t.cons}</p>
                             <SafeContentList content={reviews_analysis.company_reviews.cons} bulletColor="bg-rose-500" textColor="text-slate-300"/>
          </div>
         )}
                        </div>
                     )}
                     
                     {/* 面試環節與難度 */}
                     {reviews_analysis.job_reviews && (
                       <div className="mb-6 bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                         <h4 className="text-indigo-400 font-bold mb-3 flex items-center">
                           <FileQuestion className="w-4 h-4 mr-2" />
                           {t.interviewProcess}
                         </h4>
                         <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                           {cleanText(reviews_analysis.job_reviews.summary)}
                        </div>
                    </div>
                     )}
                    </div>
                 )}
              </div>
          </div>
         )}

        {/* 3. 市場 (網頁版) */}
        {market_analysis && (
      <div className="space-y-6">
          <div className="flex items-center mb-2">
             <span className="w-1.5 h-6 bg-sky-500 rounded-full mr-3"></span>
             <h2 className="text-xl font-bold text-white">{t.companyAnalysis}</h2>
          </div>
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
                {/* 產業概況 */}
                <div className="p-5 bg-sky-900/10 border border-sky-800/30 rounded-xl">
                  <h4 className="text-sky-400 font-bold mb-3 flex items-center text-base"><Globe className="w-5 h-5 mr-2" /> {t.industryOverview}</h4>
                  
                  {/* 產業趨勢 */}
                  <div className="mb-4">
                    <p className="text-xs text-sky-400 mb-2 font-bold uppercase tracking-widest">{t.industryTrends}</p>
                <div className="text-base text-slate-300 leading-relaxed whitespace-pre-line">
                  {cleanText(market_analysis.industry_trends)}
                </div>
              </div>

                  {/* 企業核心護城河 */}
                  {market_analysis.key_advantages && market_analysis.key_advantages.length > 0 && (
                    <div className="mb-4 pt-4 border-t border-sky-800/30">
                      <p className="text-xs text-sky-400 mb-3 font-bold uppercase tracking-widest">{t.coreMoats}</p>
                      <SafeContentList content={market_analysis.key_advantages} bulletColor="bg-sky-500" textColor="text-slate-300"/>
                    </div>
                  )}
                  
                  {/* 長期戰略風險 */}
                  {market_analysis.potential_risks && market_analysis.potential_risks.length > 0 && (
                    <div className="pt-4 border-t border-sky-800/30">
                      <p className="text-xs text-rose-400 mb-3 font-bold uppercase tracking-widest">{t.strategicRisks}</p>
                      <SafeContentList content={market_analysis.potential_risks} bulletColor="bg-rose-500" textColor="text-slate-300"/>
                    </div>
                  )}
                </div>
                
                {/* 競爭對手表格 */}
                {market_analysis.competition_table && market_analysis.competition_table.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr><th className="p-4 border-r border-slate-700">{t.competitors}</th><th className="p-4 border-r border-slate-700">{t.strengths}</th><th className="p-4">{t.weaknesses}</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-700">
                            {market_analysis.competition_table.map((c, i) => (
                               <tr key={i}><td className="p-4 font-bold text-white border-r border-slate-700">{cleanText(c.name)}</td><td className="p-4 text-emerald-400 border-r border-slate-700">{cleanText(c.strengths)}</td><td className="p-4 text-rose-400">{cleanText(c.weaknesses)}</td></tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
                )}
                 </div>
              </div>
        )}

        {/* 4. 面試 (網頁版) */}
        {interview_preparation && (
           <div className="space-y-6">
               <div className="flex items-center mb-2">
                   <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
                   <h2 className="text-xl font-bold text-white">{t.interviewPrep}</h2>
               </div>
               <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl divide-y divide-slate-700">
                   {interview_preparation.questions.map((q, idx) => (
                      <div key={idx} className="p-6">
                          <p className="font-bold text-slate-100 mb-2">Q{idx+1}: {cleanText(q.question)}</p>
                          <div className="bg-slate-900/50 p-4 rounded-lg text-slate-300 text-sm border-l-4 border-indigo-500">{cleanText(q.answer_guide)}</div>
                             </div>
                       ))}
               </div>
           </div>
        )}
                 </div>

    </div>
  );
};

export default AnalysisDashboard;