'use client';

import React, { useRef } from 'react';
import { InterviewReport } from '@/types';
import { 
  CheckCircle2, AlertTriangle, Target, Zap, 
  Activity, Download, Globe, Building2, Users, FileQuestion, MessageSquare
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DashboardProps {
  data: InterviewReport;
  language?: 'zh' | 'en';
}

// ----------------------------------------------------------------------
// 1. 核心修復：通用列表元件 (同時修復 PDF 與網頁顯示)
// ----------------------------------------------------------------------
const SafeContentList = ({ content, bulletColor = "bg-slate-500", textColor = "text-slate-300", isPdf = false }: { content: any, bulletColor?: string, textColor?: string, isPdf?: boolean }) => {
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
    <ul className={`space-y-3 mt-2 ${isPdf ? 'text-gray-900' : ''}`}>
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
                {subText && <div className={`text-xs mt-1 ${isPdf ? 'text-gray-500' : 'text-slate-500'}`}>{subText}</div>}
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

const getScoreInfo = (score: number) => {
  if (score >= 90) return { level: "鑽石米格魯", label: "頂級契合：具備即戰力", description: "您的技能與經驗幾乎完美契合職位需求。", color: "text-cyan-400", fill: "#22d3ee", icon: <BeagleIcon className="w-32 h-32 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" color="#22d3ee" spotColor="#0e7490" /> };
  if (score >= 75) return { level: "黃金米格魯", label: "高度契合：具備核心潛力", description: "您具備大部分核心技能，只需稍作準備。", color: "text-amber-400", fill: "#fbbf24", icon: <BeagleIcon className="w-32 h-32 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" color="#fbbf24" spotColor="#b45309" /> };
  if (score >= 60) return { level: "白銀米格魯", label: "中度契合：部分技能重疊", description: "您具備相關基礎，但需強調潛力。", color: "text-slate-300", fill: "#cbd5e1", icon: <BeagleIcon className="w-32 h-32 drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]" color="#cbd5e1" spotColor="#475569" /> };
  return { level: "青銅米格魯", label: "低度契合：建議重新評估", description: "目前履歷與職位需求差異較大。", color: "text-orange-400", fill: "#fb923c", icon: <BeagleIcon className="w-32 h-32 drop-shadow-[0_0_15px_rgba(251,146,60,0.4)]" color="#fb923c" spotColor="#9a3412" /> };
};

// ----------------------------------------------------------------------
// 3. 主儀表板元件
// ----------------------------------------------------------------------

const AnalysisDashboard: React.FC<DashboardProps> = ({ data }) => {
  const printRef = useRef<HTMLDivElement>(null); // 隱藏列印層
  const dashboardRef = useRef<HTMLDivElement>(null); // 顯示層

  const { basic_analysis, salary_analysis, reviews_analysis, market_analysis, match_analysis, interview_preparation } = data;
  const scoreInfo = getScoreInfo(match_analysis.score);
  const scoreData = [{ name: 'Score', value: match_analysis.score, fill: scoreInfo.fill }];

  const handleDownload = async () => {
    if (!printRef.current) return;
    const btn = document.getElementById('download-btn');
    if (btn) btn.innerText = "生成中...";

    try {
      const element = printRef.current;
      element.style.display = 'block';
      element.style.position = 'absolute';
      element.style.top = '0';
      element.style.left = '0';
      element.style.zIndex = '-9999';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794,
        backgroundColor: '#ffffff',
      });

      element.style.display = 'none';

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const safeTitle = basic_analysis?.job_title ? basic_analysis.job_title.replace(/[^\w\s\u4e00-\u9fa5]/gi, '') : 'report';
      pdf.save(`JobBeagle_Analysis_${safeTitle}.pdf`);

    } catch (error) {
      console.error('PDF Error:', error);
      alert('下載失敗');
    } finally {
      if (btn) btn.innerText = "下載報告 (PDF)";
    }
  };

  return (
    <div className="relative">
      
      {/* ========================================================= */}
      {/* A. 顯示層：網頁版深色介面 (這是你原本漂亮的介面) */}
      {/* ========================================================= */}
      <div ref={dashboardRef} className="space-y-8 animate-fade-in p-4 md:p-8 max-w-[1440px] mx-auto mb-20">
        <div className="absolute top-0 right-0 z-10 no-print">
        <button 
            id="download-btn"
          onClick={handleDownload}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg transition-all active:scale-95 border border-white/10"
        >
          <Download className="w-5 h-5" />
            <span>下載報告 (PDF)</span>
        </button>
      </div>
      
        {/* 1. 職位匹配 (網頁版) */}
      <div className="space-y-6">
        <div className="flex items-center mb-2">
           <span className="w-1.5 h-6 bg-yellow-500 rounded-full mr-3"></span>
           <h2 className="text-xl font-bold text-white">1. 職位分析與匹配評分</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col items-center relative overflow-hidden">
              <div className="flex items-center justify-center w-full mt-8 mb-8 space-x-8">
               <div className="flex flex-col items-center shrink-0">
                  {scoreInfo.icon}
                  <div className="flex flex-col items-center mt-3">
                    <span className={`text-base font-bold ${scoreInfo.color}`}>{scoreInfo.level}</span>
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
                  {/* 分数评等等级说明 */}
                  <div className="mt-4 pt-4 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">評分標準</p>
                    <div className="text-xs text-slate-400 space-y-1 text-left px-4">
                      <div className="flex items-center justify-between">
                        <span className="text-cyan-400">90+ 鑽石米格魯</span>
                        <span className="text-slate-600">頂級契合</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400">75+ 黃金米格魯</span>
                        <span className="text-slate-600">高度契合</span>
            </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">60+ 白銀米格魯</span>
                        <span className="text-slate-600">中度契合</span>
                  </div>
                      <div className="flex items-center justify-between">
                        <span className="text-orange-400">&lt;60 青銅米格魯</span>
                        <span className="text-slate-600">低度契合</span>
                  </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-700">
              <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center uppercase tracking-wide">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> 核心優勢
              </h3>
                <SafeContentList content={match_analysis.matching_points} bulletColor="bg-emerald-500" textColor="text-slate-200" />
            </div>
            <div className="flex-1 p-6 bg-slate-800/50">
              <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center uppercase tracking-wide">
                  <AlertTriangle className="w-5 h-5 mr-2" /> 待補強項目
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
            <h2 className="text-xl font-bold text-white">2. 薪資情報與公司評價</h2>
         </div>
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
                 {/* 預估薪酬與談判策略 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                        <h4 className="text-emerald-400 font-bold mb-4 flex items-center"><Target className="w-4 h-4 mr-2" /> 預估薪酬 (ESTIMATED VALUE)</h4>
                           <span className="text-2xl font-black text-white">{cleanText(salary_analysis.estimated_range)}</span>
                        <div className="mt-4">
                          <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-widest">分析推估邏輯</p>
                          <SafeContentList content={salary_analysis.rationale} bulletColor="bg-emerald-500" textColor="text-slate-300"/>
                        </div>
                       </div>
                    <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                        <h4 className="text-emerald-400 font-bold mb-4 flex items-center"><Zap className="w-4 h-4 mr-2" /> 請募攻防策略</h4>
                        <SafeContentList content={salary_analysis.negotiation_tip} bulletColor="bg-emerald-500" textColor="text-slate-300"/>
                    </div>
                  </div>
                 
                 {/* 職場生態與面試實戰情報 */}
                 {reviews_analysis && (
                   <div className="mt-6 pt-6 border-t border-slate-700/50">
                     <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                       <Users className="w-5 h-5 mr-2 text-indigo-400" />
                       職場生態與面試實戰情報
                     </h3>
                     
                     {/* 組織文化與氛圍 */}
                     {reviews_analysis.company_reviews && (
                       <div className="mb-6 bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                         <h4 className="text-indigo-400 font-bold mb-3 flex items-center">
                           <Building2 className="w-4 h-4 mr-2" />
                           組織文化與氛圍
                    </h4>
                         <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line mb-3">
                           {cleanText(reviews_analysis.company_reviews.summary)}
                  </div>
                         {reviews_analysis.company_reviews.pros && reviews_analysis.company_reviews.pros.length > 0 && (
                           <div className="mt-3">
                             <p className="text-xs text-emerald-400 mb-2 font-bold">優點</p>
                             <SafeContentList content={reviews_analysis.company_reviews.pros} bulletColor="bg-emerald-500" textColor="text-slate-300"/>
              </div>
                         )}
                         {reviews_analysis.company_reviews.cons && reviews_analysis.company_reviews.cons.length > 0 && (
                           <div className="mt-3">
                             <p className="text-xs text-rose-400 mb-2 font-bold">缺點</p>
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
                           面試環節與難度
                         </h4>
                         <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                           {cleanText(reviews_analysis.job_reviews.summary)}
                        </div>
                    </div>
                     )}
                     
                     {/* 實戰搜研考題 */}
                     {reviews_analysis.real_interview_questions && reviews_analysis.real_interview_questions.length > 0 && (
                       <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                         <h4 className="text-indigo-400 font-bold mb-4 flex items-center">
                           <MessageSquare className="w-4 h-4 mr-2" />
                           實戰搜研考題
                         </h4>
                        <div className="space-y-4">
                           {reviews_analysis.real_interview_questions.map((q, idx) => (
                             <div key={idx} className="bg-slate-800/50 p-4 rounded-lg border-l-4 border-indigo-500">
                               <p className="text-sm font-bold text-slate-200 mb-2">{cleanText(q.question)}</p>
                               <div className="flex items-center text-xs text-slate-500 space-x-3">
                                 {q.job_title && <span>{cleanText(q.job_title)}</span>}
                                 {q.year && <span>• {cleanText(q.year)}</span>}
                                 {q.source_url && (
                                   <a href={q.source_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                                     來源連結
                                   </a>
                                 )}
                                  </div>
                              </div>
                            ))}
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
             <h2 className="text-xl font-bold text-white">3. 公司介紹與前景分析</h2>
          </div>
             <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
                {/* 產業概況 */}
                <div className="p-5 bg-sky-900/10 border border-sky-800/30 rounded-xl">
                  <h4 className="text-sky-400 font-bold mb-3 flex items-center text-base"><Globe className="w-5 h-5 mr-2" /> 產業概況</h4>
                  
                  {/* 產業趨勢 */}
                  <div className="mb-4">
                    <p className="text-xs text-sky-400 mb-2 font-bold uppercase tracking-widest">產業趨勢</p>
                    <div className="text-base text-slate-300 leading-relaxed whitespace-pre-line">
                      {cleanText(market_analysis.industry_trends)}
                    </div>
                  </div>
                  
                  {/* 企業核心護城河 */}
                  {market_analysis.key_advantages && market_analysis.key_advantages.length > 0 && (
                    <div className="mb-4 pt-4 border-t border-sky-800/30">
                      <p className="text-xs text-sky-400 mb-3 font-bold uppercase tracking-widest">企業核心護城河</p>
                      <SafeContentList content={market_analysis.key_advantages} bulletColor="bg-sky-500" textColor="text-slate-300"/>
                    </div>
                  )}
                  
                  {/* 長期戰略風險 */}
                  {market_analysis.potential_risks && market_analysis.potential_risks.length > 0 && (
                    <div className="pt-4 border-t border-sky-800/30">
                      <p className="text-xs text-rose-400 mb-3 font-bold uppercase tracking-widest">長期戰略風險</p>
                      <SafeContentList content={market_analysis.potential_risks} bulletColor="bg-rose-500" textColor="text-slate-300"/>
                    </div>
                  )}
                </div>
                
                {/* 競爭對手表格 */}
                {market_analysis.competition_table && market_analysis.competition_table.length > 0 && (
                  <div className="overflow-x-auto rounded-xl border border-slate-700">
                    <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                        <thead className="bg-slate-900/50 text-slate-400">
                            <tr><th className="p-4 border-r border-slate-700">競爭對手</th><th className="p-4 border-r border-slate-700">優勢</th><th className="p-4">弱點</th></tr>
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
                   <h2 className="text-xl font-bold text-white">4. 面試考題與策略</h2>
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

      {/* ========================================================= */}
      {/* B. 列印層：隱藏的白底黑字報告 (專門給 PDF 用) */}
      {/* ========================================================= */}
      <div 
        ref={printRef} 
        id="printable-report"
        className="hidden bg-white text-gray-900 p-10 mx-auto font-sans"
        style={{ width: '794px', minHeight: '1123px' }}
      >
        {/* B1. 頁首 */}
        <div className="border-b-2 border-gray-800 pb-6 mb-8 flex justify-between items-end">
                             <div>
            <h1 className="text-3xl font-extrabold text-black mb-2">職缺戰略分析報告</h1>
            <p className="text-sm text-gray-500">
              職位：{cleanText(basic_analysis?.job_title)} | 生成日期：{new Date().toLocaleDateString()}
            </p>
                             </div>
          <div className="text-right">
             <div className="text-4xl font-black text-indigo-700">{match_analysis.score} <span className="text-sm text-gray-400">/ 100</span></div>
             <div className="text-sm font-bold text-gray-600">{scoreInfo.label}</div>
                 </div>
        </div>

        {/* B2. 匹配分析 */}
        <div className="mb-10">
          <h2 className="text-xl font-bold border-l-4 border-indigo-600 pl-3 mb-4 text-black">1. 核心優勢與缺口</h2>
          <div className="grid grid-cols-2 gap-8">
             <div className="bg-green-50 p-5 rounded border border-green-200">
                <h3 className="font-bold text-green-800 mb-3 text-lg flex items-center"><CheckCircle2 className="w-5 h-5 mr-2"/> 你的優勢</h3>
                <SafeContentList content={match_analysis.matching_points} bulletColor="bg-green-600" textColor="text-gray-900" isPdf={true} />
             </div>
             <div className="bg-orange-50 p-5 rounded border border-orange-200">
                <h3 className="font-bold text-orange-800 mb-3 text-lg flex items-center"><AlertTriangle className="w-5 h-5 mr-2"/> 建議補強</h3>
                <SafeContentList content={match_analysis.skill_gaps} bulletColor="bg-orange-600" textColor="text-gray-900" isPdf={true} />
              </div>
          </div>
      </div>

        {/* B3. 薪資 */}
        {salary_analysis && (
          <div className="mb-10 p-6 bg-gray-50 border border-gray-200 rounded-lg">
             <h2 className="text-xl font-bold border-l-4 border-emerald-600 pl-3 mb-4 text-black">2. 薪資情報</h2>
             <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
               <span className="font-bold text-gray-500 uppercase text-sm">市場預估年薪</span>
               <span className="text-3xl font-black text-emerald-700">{cleanText(salary_analysis.estimated_range)}</span>
         </div>
             <div>
               <h4 className="font-bold text-gray-900 mb-2">談判策略建議：</h4>
               <SafeContentList content={salary_analysis.negotiation_tip} bulletColor="bg-gray-400" textColor="text-gray-800" isPdf={true} />
                      </div>
                    </div>
        )}

        {/* B4. 市場 */}
        {market_analysis && (
          <div className="mb-10">
             <h2 className="text-xl font-bold border-l-4 border-blue-600 pl-3 mb-4 text-black">3. 產業競爭分析</h2>
             <div className="mb-4 text-sm text-gray-700 whitespace-pre-line">{cleanText(market_analysis.industry_trends)}</div>
             <table className="w-full text-left text-sm border-collapse border border-gray-300 shadow-sm">
                <thead className="bg-gray-100 text-gray-800 font-bold">
                  <tr><th className="p-3 border border-gray-300">競爭對手</th><th className="p-3 border border-gray-300">優勢</th><th className="p-3 border border-gray-300">弱點</th></tr>
                </thead>
                <tbody>
                  {market_analysis.competition_table?.map((c, i) => (
                    <tr key={i} className="odd:bg-white even:bg-gray-50">
                      <td className="p-3 border border-gray-300 font-bold text-gray-900">{cleanText(c.name)}</td>
                      <td className="p-3 border border-gray-300 text-green-700">{cleanText(c.strengths)}</td>
                      <td className="p-3 border border-gray-300 text-red-700">{cleanText(c.weaknesses)}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {/* B5. 面試 */}
        {interview_preparation && (
          <div className="mb-10">
            <h2 className="text-xl font-bold border-l-4 border-purple-600 pl-3 mb-4 text-black">4. 模擬面試題庫</h2>
            <div className="space-y-4">
              {interview_preparation.questions.slice(0, 5).map((q, idx) => (
                <div key={idx} className="border border-gray-200 rounded p-4 break-inside-avoid">
                  <div className="font-bold text-purple-900 mb-2 text-lg">Q{idx+1}: {cleanText(q.question)}</div>
                  <div className="text-sm text-gray-800 bg-gray-50 p-3 rounded italic border-l-2 border-purple-300">
                    <span className="font-bold not-italic text-purple-700 mr-2">建議回答:</span>
                        {cleanText(q.answer_guide)}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}
        
        <div className="text-center text-xs text-gray-400 mt-12 border-t border-gray-300 pt-4">
           此報告由 JobBeagle AI 戰略分析引擎生成
          </div>
      </div>

    </div>
  );
};

export default AnalysisDashboard;