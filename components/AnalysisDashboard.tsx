'use client';

import React from 'react';
import { InterviewReport } from '@/types';
import { 
  CheckCircle2, AlertTriangle, Target, MessageSquare, Globe, Briefcase, Zap, 
  TrendingUp, Building2, Users, MessagesSquare, 
  Activity, ThumbsUp, FileQuestion, Search, Info,
  Download
} from 'lucide-react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  data: InterviewReport;
}

const cleanText = (text: string | any): string => {
  if (typeof text !== 'string') return text;
  let cleaned = text.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/\[\d+(,\s*\d+)*\]/g, '');
  return cleaned;
};

const ContentList = ({ content, bulletColor = "bg-slate-500", fontSize = "text-sm" }: { content: any, bulletColor?: string, fontSize?: string }) => {
  if (!content) return null;
  let items: string[] = [];
  if (Array.isArray(content)) {
     items = content.map(item => String(item).trim()).filter(s => s.length > 0);
  } else if (typeof content === 'string') {
     items = content.split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.replace(/^[\d\.\-\•\*\s]+/, '')); 
  } else {
     items = [String(content)];
  }
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2.5 mt-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start">
          <span className={`mt-1.5 mr-3 w-1.5 h-1.5 rounded-full ${bulletColor} shrink-0 opacity-80`} />
          <span className={`${fontSize} text-slate-300 leading-relaxed`}>{cleanText(item)}</span>
        </li>
      ))}
    </ul>
  );
};

export const BeagleIcon = ({ className, color = "#475569", spotColor = "#5d4037", bellyColor = "#5d4037" }: { className?: string, color?: string, spotColor?: string, bellyColor?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M35 65 C30 75 30 85 35 90 C40 95 60 95 65 90 C70 85 70 75 65 65" fill="white" stroke={color} strokeWidth="1.5" />
    <path d="M40 70 Q50 65 60 70 L62 85 Q50 90 38 85 Z" fill="#f5f5f5" />
    <ellipse cx="50" cy="80" rx="8" ry="4" fill={bellyColor} opacity="0.3" />
    <path d="M50 20 C65 20 75 30 75 45 C75 55 65 65 50 65 C35 65 25 55 25 45 C25 30 35 20 50 20Z" fill="white" stroke={color} strokeWidth="2" />
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
  if (score >= 90) return {
    level: "鑽石米格魯",
    enLevel: "(Diamond Beagle)",
    label: "頂級契合：具備即戰力",
    description: "您的技能與經驗幾乎完美契合職位需求，是該職位的理想人選。",
    color: "text-cyan-400",
    fill: "#22d3ee",
    spot: "#0e7490",
    icon: <BeagleIcon className="w-32 h-32 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" color="#22d3ee" spotColor="#0e7490" bellyColor="#0e7490" />
  };
  if (score >= 75) return {
    level: "黃金米格魯",
    enLevel: "(Golden Beagle)",
    label: "高度契合：具備核心潛力",
    description: "您具備大部分核心技能，只需針對特定領域稍作準備即可勝任。",
    color: "text-amber-400",
    fill: "#fbbf24",
    spot: "#b45309",
    icon: <BeagleIcon className="w-32 h-32 drop-shadow-[0_0_20px_rgba(251,191,36,0.6)]" color="#fbbf24" spotColor="#b45309" bellyColor="#b45309" />
  };
  if (score >= 60) return {
    level: "白銀米格魯",
    enLevel: "(Silver Beagle)",
    label: "中度契合：部分技能重疊",
    description: "您具備相關基礎，但部分關鍵需求尚有差距，面試時需強調潛力。",
    color: "text-slate-300",
    fill: "#cbd5e1",
    spot: "#475569",
    icon: <BeagleIcon className="w-32 h-32 drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]" color="#cbd5e1" spotColor="#475569" bellyColor="#475569" />
  };
  return {
    level: "青銅米格魯",
    enLevel: "(Bronze Beagle)",
    label: "低度契合：建議重新評估",
    description: "目前履歷與職位需求差異較大，建議針對此職缺大幅度調整履歷重點。",
    color: "text-orange-400",
    fill: "#fb923c",
    spot: "#9a3412",
    icon: <BeagleIcon className="w-32 h-32 drop-shadow-[0_0_15px_rgba(251,146,60,0.4)]" color="#fb923c" spotColor="#9a3412" bellyColor="#9a3412" />
  };
};

const AnalysisDashboard: React.FC<DashboardProps> = ({ data }) => {
  const { basic_analysis, salary_analysis, reviews_analysis, market_analysis, match_analysis, interview_preparation } = data;
  const scoreInfo = getScoreInfo(match_analysis.score);
  const scoreData = [{ name: 'Score', value: match_analysis.score, fill: scoreInfo.fill }];

  /**
   * 將 InterviewReport 數據轉換為純文字格式
   * @returns {string} 純文字格式的報告內容
   */
  const convertToPlainText = (): string => {
    let text = `# JobBeagle 職位分析報告 - ${basic_analysis?.job_title || '未命名職位'}\n\n`;
    text += `生成時間: ${new Date().toLocaleString('zh-TW')}\n\n`;

    text += `## 1. 職位分析與匹配評分\n\n`;
    text += `匹配分數: ${match_analysis.score} 分 (${scoreInfo.label})\n`;
    text += `說明: ${scoreInfo.description}\n\n`;

    text += `### 核心優勢與契合點\n`;
    match_analysis.matching_points.forEach((point, idx) => {
      text += `- ${cleanText(point.point)}: ${cleanText(point.description)}\n`;
    });
    text += `\n`;

    text += `### 關鍵待補強項目\n`;
    match_analysis.skill_gaps.forEach((gap, idx) => {
      text += `- ${cleanText(gap.gap)}: ${cleanText(gap.description)}\n`;
    });
    text += `\n`;

    if (salary_analysis) {
      text += `## 2. 薪資情報與公司評價\n\n`;
      text += `### 預估薪酬: ${cleanText(salary_analysis.estimated_range)}\n`;
      text += `分析推估邏輯:\n`;
      if (Array.isArray(salary_analysis.rationale)) {
        salary_analysis.rationale.forEach(item => text += `- ${cleanText(item)}\n`);
      } else {
        text += `${cleanText(salary_analysis.rationale)}\n`;
      }
      text += `\n`;
      text += `談薪攻防策略:\n`;
      if (Array.isArray(salary_analysis.negotiation_tip)) {
        salary_analysis.negotiation_tip.forEach(item => text += `- ${cleanText(item)}\n`);
      } else {
        text += `${cleanText(salary_analysis.negotiation_tip)}\n`;
      }
      text += `\n`;
    }

    if (reviews_analysis) {
      text += `### 職場生態與面試實戰情報\n`;
      text += `#### 組織文化與氛圍\n`;
      text += `${cleanText(reviews_analysis.company_reviews.summary)}\n\n`;
      text += `#### 面試環節與難度\n`;
      text += `${cleanText(reviews_analysis.job_reviews.summary)}\n\n`;

      if (reviews_analysis.real_interview_questions?.length > 0) {
        text += `#### 實戰搜研考題\n`;
        reviews_analysis.real_interview_questions.forEach((item, idx) => {
          text += `${idx + 1}. "${cleanText(item.question)}"\n`;
          text += `   職位: ${cleanText(item.job_title)}\n`;
          text += `   來源: ${cleanText(item.year)}\n`;
          if (item.source_url) text += `   連結: ${item.source_url}\n`;
          text += `\n`;
        });
      }
    }

    if (market_analysis) {
      text += `## 3. 公司介紹與前景分析\n\n`;
      text += `### 產業概況與趨勢\n`;
      text += `${cleanText(market_analysis.industry_trends)}\n\n`;

      text += `### 競爭格局\n`;
      market_analysis.competition_table?.forEach(c => {
        text += `- ${cleanText(c.name)}\n`;
        text += `  - 優勢: ${cleanText(c.strengths)}\n`;
        text += `  - 弱點: ${cleanText(c.weaknesses)}\n`;
      });
      text += `\n`;

      text += `### 企業核心護城河 (Moat)\n`;
      market_analysis.key_advantages?.forEach(adv => {
        text += `- ${cleanText(adv.point)}: ${cleanText(adv.description)}\n`;
      });
      text += `\n`;

      text += `### 長期戰略風險\n`;
      market_analysis.potential_risks?.forEach(risk => {
        text += `- ${cleanText(risk.point)}: ${cleanText(risk.description)}\n`;
      });
      text += `\n`;
    }

    if (interview_preparation) {
      text += `## 4. 面試考題與策略建議\n\n`;
      text += `### 專家級模擬面試對策\n`;
      interview_preparation.questions.forEach((q, idx) => {
        text += `Q${idx + 1}: ${cleanText(q.question)}\n`;
        text += `來源: ${cleanText(q.source)}\n`;
        text += `回答建議: ${cleanText(q.answer_guide)}\n\n`;
      });
    }

    return text;
  };

  /**
   * 實作真實的『下載報告』按鈕：
   * 將 AI 產出的分析內容轉換為 Blob 物件並下載
   * 確保在分析完成且數據已成功存入資料庫後才可用
   */
  const handleDownload = () => {
    try {
      // 確保數據完整性：檢查必要欄位是否存在
      if (!data || !basic_analysis || !match_analysis) {
        alert('報告數據不完整，無法下載。請重新生成報告。');
        return;
      }

      // 將分析內容轉換為 Markdown 格式（.md）
      const textContent = convertToPlainText();

      // 創建 Blob 物件（格式為 Markdown .md）
      const blob = new Blob([textContent], { type: 'text/markdown;charset=utf-8' });

      // 生成檔名：包含職稱與日期
      const jobTitle = basic_analysis?.job_title || '未命名職位';
      const sanitizedTitle = jobTitle.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 50);
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const fileName = `JobBeagle_${sanitizedTitle}_${date}.md`;

      // 創建 URL 物件
      const url = URL.createObjectURL(blob);

      // 建立一個隱藏的 <a> 標籤並觸發 click() 來實現瀏覽器直接下載
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';

      // 將連結添加到 DOM，觸發點擊，然後移除
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 釋放 URL 物件
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下載報告時發生錯誤:', error);
      alert('下載報告時發生錯誤，請稍後再試。');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in relative">
      <div className="absolute -top-14 right-0 no-print">
        <button 
          onClick={handleDownload}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-bold shadow-lg transition-all active:scale-95 border border-white/10"
        >
          <Download className="w-5 h-5" />
          <span>下載儲存報告</span>
        </button>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center mb-2">
           <span className="w-1.5 h-6 bg-yellow-500 rounded-full mr-3"></span>
           <h2 className="text-xl font-bold text-white">1. 職位分析與匹配評分</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex flex-col items-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1`} style={{backgroundColor: scoreInfo.fill}}></div>
            
            <div className="flex items-center justify-center w-full mt-8 mb-8 space-x-12">
               <div className="flex flex-col items-center shrink-0">
                  {scoreInfo.icon}
                  <div className="flex flex-col items-center mt-3">
                    <span className={`text-base font-bold ${scoreInfo.color}`}>{scoreInfo.level}</span>
                  </div>
               </div>

               <div className="relative w-40 h-40 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart innerRadius="70%" outerRadius="100%" barSize={10} data={scoreData} startAngle={90} endAngle={-270}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={30} />
                      </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className={`text-5xl font-black ${scoreInfo.color}`}>
                        {match_analysis.score}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Score</span>
                  </div>
               </div>
            </div>

            <div className="w-full text-center mb-6">
                <p className={`text-xl font-bold ${scoreInfo.color} mb-1`}>{scoreInfo.label}</p>
                <p className="text-sm text-slate-400 px-4 leading-relaxed">{scoreInfo.description}</p>
            </div>

            <div className="w-full pt-6 border-t border-slate-700/50">
               <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="flex items-center text-[10px] text-cyan-400 font-bold bg-cyan-900/10 px-2 py-1.5 rounded border border-cyan-500/10">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 shadow-[0_0_5px_rgba(34,211,238,0.5)]"></span> 90+ 鑽石
                  </div>
                  <div className="flex items-center text-[10px] text-amber-400 font-bold bg-amber-900/10 px-2 py-1.5 rounded border border-amber-500/10">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mr-2 shadow-[0_0_5px_rgba(251,191,36,0.5)]"></span> 75+ 黃金
                  </div>
                  <div className="flex items-center text-[10px] text-slate-300 font-bold bg-slate-900/30 px-2 py-1.5 rounded border border-slate-700">
                    <span className="w-2 h-2 rounded-full bg-slate-400 mr-2"></span> 60+ 白銀
                  </div>
                  <div className="flex items-center text-[10px] text-orange-400 font-bold bg-orange-900/10 px-2 py-1.5 rounded border border-orange-500/10">
                    <span className="w-2 h-2 rounded-full bg-orange-400 mr-2"></span> &lt;60 青銅
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-700">
              <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 mr-2" /> 核心優勢與契合點
              </h3>
              <ul className="space-y-4">
                {match_analysis.matching_points.map((point, idx) => (
                  <li key={idx} className="flex items-start group">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2 mr-2 group-hover:scale-125 transition-transform"></span>
                    <div>
                      <p className="text-base font-bold text-slate-200 mb-1">{cleanText(point.point)}</p>
                      <p className="text-sm text-slate-400 leading-relaxed">{cleanText(point.description)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 p-6 bg-slate-800/50">
              <h3 className="text-base font-bold text-amber-400 mb-4 flex items-center uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 mr-2" /> 關鍵待補強項目
              </h3>
              <ul className="space-y-4">
                {match_analysis.skill_gaps.map((gap, idx) => (
                  <li key={idx} className="flex items-start group">
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 mt-2 mr-2 group-hover:scale-125 transition-transform"></span>
                    <div>
                      <p className="text-base font-bold text-slate-200 mb-1">{cleanText(gap.gap)}</p>
                      <p className="text-sm text-slate-400 leading-relaxed">{cleanText(gap.description)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center mb-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full mr-3"></span>
            <h2 className="text-xl font-bold text-white">2. 薪資情報與公司評價</h2>
         </div>
         {salary_analysis && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                    <h4 className="text-emerald-400 font-bold mb-4 flex flex-col uppercase text-sm tracking-wide">
                        <span className="flex items-center mb-2"><Target className="w-4 h-4 mr-2" /> 預估薪酬 (Estimated Value)</span>
                        <div className="flex items-center">
                           <span className="text-2xl font-black text-white">{cleanText(salary_analysis.estimated_range)}</span>
                        </div>
                    </h4>
                    <div className="mb-4">
                       <p className="text-sm font-semibold text-slate-500 mb-1 flex items-center"><Info className="w-4 h-4 mr-1" /> 分析推估邏輯：</p>
                       <div className="text-base text-slate-300">
                         <ContentList fontSize="text-base" content={salary_analysis.rationale} bulletColor="bg-emerald-500" />
                       </div>
                    </div>
                  </div>
                  <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                    <h4 className="text-emerald-400 font-bold mb-4 flex items-center uppercase text-sm tracking-wide">
                        <Zap className="w-4 h-4 mr-2" /> 談薪攻防策略
                    </h4>
                    <div className="text-base text-slate-300"><ContentList fontSize="text-base" content={salary_analysis.negotiation_tip} bulletColor="bg-emerald-500" /></div>
                  </div>
              </div>
          </div>
         )}
         {reviews_analysis && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center border-b border-slate-700 pb-2">
                <MessagesSquare className="w-6 h-6 mr-2 text-emerald-400" /> 職場生態與面試實戰情報
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50 flex flex-col space-y-8">
                    <div>
                        <h4 className="text-base font-bold text-slate-200 flex items-center mb-4"><Building2 className="w-5 h-5 mr-2 text-emerald-400" /> 組織文化與氛圍</h4>
                        <div className="text-base text-slate-300 font-medium leading-relaxed">
                          <ContentList fontSize="text-base" content={reviews_analysis.company_reviews.summary} bulletColor="bg-emerald-500" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-base font-bold text-slate-200 flex items-center mb-4"><Users className="w-5 h-5 mr-2 text-blue-400" /> 面試環節與難度</h4>
                        <div className="text-base text-slate-300 font-medium leading-relaxed">
                          <ContentList fontSize="text-base" content={reviews_analysis.job_reviews.summary} bulletColor="bg-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50 flex flex-col">
                    <h4 className="text-base font-bold text-slate-200 flex items-center mb-4"><FileQuestion className="w-5 h-5 mr-2 text-purple-400" /> 實戰搜研考題</h4>
                    <div className="flex-grow space-y-4 overflow-y-auto max-h-[500px] pr-1">
                      {reviews_analysis.real_interview_questions?.length > 0 ? (
                        <div className="space-y-4">
                            {reviews_analysis.real_interview_questions.map((item, idx) => (
                              <div key={idx} className="bg-slate-800 p-4 rounded border border-slate-700/50 hover:border-purple-500/30 transition-colors group">
                                  <p className="text-base text-slate-200 font-bold mb-4 leading-relaxed">
                                    {idx + 1}. "{cleanText(item.question)}"
                                  </p>
                                  <div className="flex justify-between items-end text-[11px] border-t border-slate-700/50 pt-3">
                                      <div className="text-purple-400/90 italic font-bold max-w-[65%] truncate">
                                          {cleanText(item.job_title)}
                                      </div>
                                      <div className="text-slate-500 font-medium">
                                          {cleanText(item.year)}
                                      </div>
                                  </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm text-center p-4">
                            <Search className="w-10 h-10 mb-2 opacity-20" />
                            <p>無公開數據可用</p>
                        </div>
                      )}
                    </div>
                </div>
              </div>
          </div>
         )}
      </div>

      <div className="space-y-6">
          <div className="flex items-center mb-2">
             <span className="w-1.5 h-6 bg-sky-500 rounded-full mr-3"></span>
             <h2 className="text-xl font-bold text-white">3. 公司介紹與前景分析</h2>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
              <h3 className="text-xl font-bold text-white flex items-center border-b border-slate-700 pb-4 mb-6">
                <Activity className="w-6 h-6 mr-2 text-sky-400" />
                競爭格局 (Competitive Landscape)
              </h3>
              
              <div className="mb-6 p-5 bg-sky-900/10 border border-sky-800/30 rounded-xl">
                <h4 className="text-sky-400 font-bold mb-3 flex items-center text-base"><Globe className="w-5 h-5 mr-2" /> 產業概況與趨勢</h4>
                <div className="text-base text-slate-300 leading-relaxed whitespace-pre-line">
                  {cleanText(market_analysis.industry_trends)}
                </div>
              </div>

              <div className="mb-8 overflow-hidden rounded-xl border border-slate-700">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse min-w-[600px]">
                       <thead>
                          <tr className="bg-slate-900/50 text-slate-400 uppercase tracking-wider font-semibold">
                             <th className="px-5 py-4 border-r border-slate-700">競爭對手名稱 (含目標公司)</th>
                             <th className="px-5 py-4 border-r border-slate-700">核心優勢 (Moat)</th>
                             <th className="px-5 py-4">策略威脅或弱點</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-700">
                          {market_analysis.competition_table?.map((c, i) => (
                             <tr key={i} className={i === 0 ? "bg-sky-900/10" : ""}>
                                <td className="px-5 py-5 font-black text-slate-200 border-r border-slate-700">{cleanText(c.name)}</td>
                                <td className="px-5 py-5 text-emerald-400 border-r border-slate-700 leading-relaxed font-medium">{cleanText(c.strengths)}</td>
                                <td className="px-5 py-5 text-rose-400 leading-relaxed font-medium">{cleanText(c.weaknesses)}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                    <h4 className="text-emerald-400 font-bold mb-4 flex items-center uppercase text-base tracking-wide"><ThumbsUp className="w-5 h-5 mr-2" /> 企業核心護城河 (Moat)</h4>
                    <ul className="space-y-4">
                       {market_analysis.key_advantages?.map((adv, idx) => (
                          <li key={idx} className="flex items-start group">
                             <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2 mr-2"></span>
                             <div>
                                <p className="text-base font-bold text-slate-200 mb-1">{cleanText(adv.point)}</p>
                                <p className="text-sm text-slate-400 leading-relaxed">{cleanText(adv.description)}</p>
                             </div>
                          </li>
                       ))}
                    </ul>
                 </div>
                 <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                    <h4 className="text-rose-400 font-bold mb-4 flex items-center uppercase text-base tracking-wide"><AlertTriangle className="w-5 h-5 mr-2" /> 長期戰略風險</h4>
                     <ul className="space-y-4">
                       {market_analysis.potential_risks?.map((risk, idx) => (
                          <li key={idx} className="flex items-start group">
                             <span className="flex-shrink-0 w-2 h-2 rounded-full bg-rose-500 mt-2 mr-2"></span>
                             <div>
                                <p className="text-base font-bold text-slate-200 mb-1">{cleanText(risk.point)}</p>
                                <p className="text-sm text-slate-400 leading-relaxed">{cleanText(risk.description)}</p>
                             </div>
                          </li>
                       ))}
                    </ul>
                 </div>
              </div>
          </div>
      </div>

      <div className="space-y-6">
         <div className="flex items-center mb-2">
             <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
             <h2 className="text-xl font-bold text-white">4. 面試考題與策略建議</h2>
         </div>
         <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold text-white flex items-center"><MessageSquare className="w-6 h-6 mr-3 text-indigo-400" /> 專家級模擬面試對策</h3>
                <p className="text-sm text-slate-400 mt-1">針對此職位深層邏輯預測的攻防策略 (技術考題優先)</p>
              </div>
              <div className="divide-y divide-slate-700">
                {interview_preparation.questions.map((q, idx) => (
                  <div key={idx} className="p-6 hover:bg-slate-700/30 transition-colors">
                    <div className="mb-4">
                      <p className="text-base font-bold text-slate-100 mb-1">Q{idx + 1}: {cleanText(q.question)}</p>
                      <div className="flex items-center">
                        <span className={`text-xs px-2 py-0.5 rounded border tracking-wide font-bold bg-slate-900 text-slate-500 border-slate-700 uppercase`}>
                           {cleanText(q.source)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 bg-slate-900/50 p-5 rounded-xl border border-slate-700/50">
                      <p className="text-base text-slate-300 leading-relaxed font-medium">
                        {cleanText(q.answer_guide)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
