'use client';

import { AppLanguage } from '@/lib/language-context';
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Upload, FileText, Sparkles, CheckCircle,
  Loader2, ChevronDown, ChevronUp, Clock, BookmarkPlus, CheckCircle2
} from 'lucide-react';
import { ResumeInput, InterviewReport } from '@/types';
import { createClient } from '@/lib/supabase/browser';
import QuotaPaywallCard from '@/components/QuotaPaywallCard';

interface SavedResume {
  id: string;
  type: 'text' | 'file';
  content: string;
  mimeType?: string;
  fileName?: string;
  timestamp: number;
}

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  companyName: string;
  location: string;
  salary: string;
  jobDescription: string;
  language?: AppLanguage;
  /** When set, shows "Apply with this resume" after analysis (email-apply jobs only). */
  onApplyWithResume?: (resumeId: string) => void;
  canApply?: boolean;
}

// ─── Progress helpers (mirrors P1 logic) ──────────────────────────────────────

const PROGRESS_SCHEDULE = [
  { time: 0,   progress: 0  },
  { time: 4,   progress: 15 },
  { time: 11,  progress: 35 },
  { time: 21,  progress: 55 },
  { time: 34,  progress: 72 },
  { time: 48,  progress: 85 },
  { time: 65,  progress: 93 },
  { time: 100, progress: 99 },
];

function getProgressAtTime(elapsedSec: number): number {
  for (let i = 1; i < PROGRESS_SCHEDULE.length; i++) {
    if (elapsedSec <= PROGRESS_SCHEDULE[i].time) {
      const prev = PROGRESS_SCHEDULE[i - 1];
      const next = PROGRESS_SCHEDULE[i];
      const t = (elapsedSec - prev.time) / (next.time - prev.time);
      return Math.round(prev.progress + t * (next.progress - prev.progress));
    }
  }
  return 99;
}

const STAGES: Record<string, Array<{ minProgress: number; label: string }>> = {
  'zh-TW': [
    { minProgress: 0,  label: '🔍 讀取職缺資訊...' }, { minProgress: 15, label: '📋 分析職缺要求...' },
    { minProgress: 35, label: '🌐 蒐集市場情報...' }, { minProgress: 55, label: '💰 比對薪資數據...' },
    { minProgress: 72, label: '🔎 評估履歷匹配...' }, { minProgress: 85, label: '🎯 挖掘面試情報...' },
    { minProgress: 93, label: '📊 整合報告中...' },
  ],
  'zh-CN': [
    { minProgress: 0,  label: '🔍 读取职位信息...' }, { minProgress: 15, label: '📋 分析职位要求...' },
    { minProgress: 35, label: '🌐 收集市场情报...' }, { minProgress: 55, label: '💰 对比薪资数据...' },
    { minProgress: 72, label: '🔎 评估简历匹配...' }, { minProgress: 85, label: '🎯 挖掘面试情报...' },
    { minProgress: 93, label: '📊 整合报告中...' },
  ],
  en: [
    { minProgress: 0,  label: '🔍 Reading job description...' }, { minProgress: 15, label: '📋 Analyzing requirements...' },
    { minProgress: 35, label: '🌐 Gathering market data...' }, { minProgress: 55, label: '💰 Benchmarking salary...' },
    { minProgress: 72, label: '🔎 Evaluating resume match...' }, { minProgress: 85, label: '🎯 Researching interview insights...' },
    { minProgress: 93, label: '📊 Compiling report...' },
  ],
  es: [
    { minProgress: 0,  label: '🔍 Leyendo descripción...' }, { minProgress: 15, label: '📋 Analizando requisitos...' },
    { minProgress: 35, label: '🌐 Recopilando datos del mercado...' }, { minProgress: 55, label: '💰 Comparando salarios...' },
    { minProgress: 72, label: '🔎 Evaluando coincidencia...' }, { minProgress: 85, label: '🎯 Investigando entrevistas...' },
    { minProgress: 93, label: '📊 Compilando informe...' },
  ],
  hi: [
    { minProgress: 0,  label: '🔍 नौकरी विवरण पढ़ रहे हैं...' }, { minProgress: 15, label: '📋 आवश्यकताओं का विश्लेषण...' },
    { minProgress: 35, label: '🌐 बाजार डेटा एकत्र...' }, { minProgress: 55, label: '💰 वेतन की तुलना...' },
    { minProgress: 72, label: '🔎 मिलान का मूल्यांकन...' }, { minProgress: 85, label: '🎯 साक्षात्कार शोध...' },
    { minProgress: 93, label: '📊 रिपोर्ट संकलन...' },
  ],
  ar: [
    { minProgress: 0,  label: '🔍 قراءة الوصف...' }, { minProgress: 15, label: '📋 تحليل المتطلبات...' },
    { minProgress: 35, label: '🌐 جمع بيانات السوق...' }, { minProgress: 55, label: '💰 مقارنة الرواتب...' },
    { minProgress: 72, label: '🔎 تقييم التوافق...' }, { minProgress: 85, label: '🎯 البحث عن المقابلات...' },
    { minProgress: 93, label: '📊 إعداد التقرير...' },
  ],
};

function getStageLabel(progress: number, lang: AppLanguage = 'en'): string {
  const stages = STAGES[lang] ?? STAGES['en'];
  for (let i = stages.length - 1; i >= 0; i--) {
    if (progress >= stages[i].minProgress) return stages[i].label;
  }
  return stages[0].label;
}

// ─── Shared section wrapper ───────────────────────────────────────────────────

const Section: React.FC<{
  id: string;
  title: string;
  preview: React.ReactNode;
  expanded: string | null;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}> = ({ id, title, preview, expanded, onToggle, children }) => {
  const isOpen = expanded === id;
  return (
    <div className="bg-slate-800 rounded-2xl overflow-hidden">
      <button onClick={() => onToggle(id)} className="w-full flex items-start justify-between px-4 py-3 gap-2 text-left">
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm">{title}</div>
          {!isOpen && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{preview}</div>
          )}
        </div>
        {isOpen ? <ChevronUp size={15} className="text-gray-400 shrink-0 mt-0.5" /> : <ChevronDown size={15} className="text-gray-400 shrink-0 mt-0.5" />}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

// ─── Full-data mobile report ──────────────────────────────────────────────────

const CompactReport: React.FC<{ report: InterviewReport }> = ({ report }) => {
  const { match_analysis, salary_analysis, reviews_analysis, interview_preparation, basic_analysis, market_analysis } = report;
  const [expanded, setExpanded] = useState<string | null>('match');

  const score = match_analysis.score;
  const scoreColor =
    score >= 90 ? '#22d3ee' :
    score >= 75 ? '#fbbf24' :
    score >= 60 ? '#cbd5e1' : '#fb923c';
  const scoreLabel =
    match_analysis.dog_type ||
    (score >= 90 ? '頂級契合' :
    score >= 75 ? '高度契合' :
    score >= 60 ? '中度契合' : '低度契合');

  const circumference = 2 * Math.PI * 32;
  const toggle = (s: string) => setExpanded(prev => prev === s ? null : s);

  return (
    <div className="space-y-3">
      {/* ── Score Hero ─────────────────────────────────── */}
      <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="32" fill="none"
              stroke={scoreColor} strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - score / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-white">{score}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-bold" style={{ color: scoreColor }}>{scoreLabel}</div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">{basic_analysis.job_title}</div>
          {match_analysis.recruiter_insight && (
            <div className="text-xs text-gray-300 mt-2 leading-relaxed line-clamp-4 border border-slate-600/60 rounded-lg p-2 bg-slate-800/50">
              {match_analysis.recruiter_insight}
            </div>
          )}
          {basic_analysis.job_summary && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{basic_analysis.job_summary}</div>
          )}
        </div>
      </div>

      {/* ── 1. 核心優勢與缺口（全量） ─────────────────── */}
      <Section
        id="match" title="✅ 核心優勢與缺口"
        preview={match_analysis.matching_points[0]?.point}
        expanded={expanded} onToggle={toggle}
      >
        {match_analysis.matching_points.length > 0 && (
          <div className="mb-3">
            <div className="text-xs font-bold text-green-400 mb-2 uppercase tracking-wide">你的優勢</div>
            <div className="space-y-2.5">
              {match_analysis.matching_points.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-green-400 text-xs mt-0.5 shrink-0 font-bold">✓</span>
                  <div>
                    <div className="text-xs font-semibold text-green-300">{p.point}</div>
                    {p.description && <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{p.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {match_analysis.skill_gaps.length > 0 && (
          <div>
            <div className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wide">待補強</div>
            <div className="space-y-2.5">
              {match_analysis.skill_gaps.map((g, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-amber-400 text-xs mt-0.5 shrink-0 font-bold">!</span>
                  <div>
                    <div className="text-xs font-semibold text-amber-300">{g.gap}</div>
                    {g.description && <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{g.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* ── 2. 薪資情報（全量） ────────────────────────── */}
      <Section
        id="salary" title="💰 薪資情報"
        preview={salary_analysis.estimated_range}
        expanded={expanded} onToggle={toggle}
      >
        <div className="text-xl font-black text-amber-400 mb-1">{salary_analysis.estimated_range}</div>
        {salary_analysis.market_position && (
          <div className="text-xs text-gray-400 mb-3 leading-relaxed">{salary_analysis.market_position}</div>
        )}
        {salary_analysis.rationale && (
          <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
            <div className="text-xs font-bold text-gray-300 mb-1">推估邏輯</div>
            <div className="text-xs text-gray-400 leading-relaxed">{salary_analysis.rationale}</div>
          </div>
        )}
        {salary_analysis.negotiation_tip && (
          <div className="bg-amber-900/20 border border-amber-600/30 rounded-lg p-3">
            <div className="text-xs font-bold text-amber-400 mb-1">談判策略</div>
            <div className="text-xs text-amber-300 leading-relaxed">{salary_analysis.negotiation_tip}</div>
          </div>
        )}
      </Section>

      {/* ── 3. 公司評價（全量，原本缺失） ────────────── */}
      {(reviews_analysis?.company_reviews || reviews_analysis?.job_reviews) && (
        <Section
          id="reviews" title="🏢 公司評價與職場生態"
          preview={reviews_analysis.company_reviews?.summary}
          expanded={expanded} onToggle={toggle}
        >
          {reviews_analysis.company_reviews?.summary && (
            <div className="mb-4">
              <div className="text-xs text-gray-300 leading-relaxed mb-2">{reviews_analysis.company_reviews.summary}</div>
              {reviews_analysis.company_reviews.pros?.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs font-bold text-green-400 mb-1">優點</div>
                  {reviews_analysis.company_reviews.pros.map((p, i) => (
                    <div key={i} className="flex gap-1.5 mb-1">
                      <span className="text-green-400 text-xs shrink-0">✓</span>
                      <span className="text-xs text-gray-400 leading-relaxed">{p}</span>
                    </div>
                  ))}
                </div>
              )}
              {reviews_analysis.company_reviews.cons?.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-red-400 mb-1">缺點</div>
                  {reviews_analysis.company_reviews.cons.map((c, i) => (
                    <div key={i} className="flex gap-1.5 mb-1">
                      <span className="text-red-400 text-xs shrink-0">✗</span>
                      <span className="text-xs text-gray-400 leading-relaxed">{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {reviews_analysis.job_reviews?.summary && (
            <div className="border-t border-slate-700 pt-3 mt-1">
              <div className="text-xs font-bold text-gray-300 mb-1">職位評價</div>
              <div className="text-xs text-gray-400 leading-relaxed mb-2">{reviews_analysis.job_reviews.summary}</div>
              {reviews_analysis.job_reviews.pros?.length > 0 && (
                <div className="mb-2">
                  {reviews_analysis.job_reviews.pros.map((p, i) => (
                    <div key={i} className="flex gap-1.5 mb-1">
                      <span className="text-green-400 text-xs shrink-0">✓</span>
                      <span className="text-xs text-gray-400 leading-relaxed">{p}</span>
                    </div>
                  ))}
                </div>
              )}
              {reviews_analysis.job_reviews.cons?.length > 0 && (
                <div>
                  {reviews_analysis.job_reviews.cons.map((c, i) => (
                    <div key={i} className="flex gap-1.5 mb-1">
                      <span className="text-red-400 text-xs shrink-0">✗</span>
                      <span className="text-xs text-gray-400 leading-relaxed">{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ── 4. 公司與產業分析（全量，原本缺失） ──────── */}
      {(basic_analysis.company_overview || market_analysis?.industry_trends) && (
        <Section
          id="market" title="🏭 公司介紹與產業分析"
          preview={basic_analysis.company_overview}
          expanded={expanded} onToggle={toggle}
        >
          {basic_analysis.company_overview && (
            <div className="mb-3">
              <div className="text-xs font-bold text-gray-300 mb-1">公司概況</div>
              <div className="text-xs text-gray-400 leading-relaxed">{basic_analysis.company_overview}</div>
            </div>
          )}
          {basic_analysis.business_scope && (
            <div className="mb-3">
              <div className="text-xs font-bold text-gray-300 mb-1">業務範疇</div>
              <div className="text-xs text-gray-400 leading-relaxed">{basic_analysis.business_scope}</div>
            </div>
          )}
          {market_analysis?.industry_trends && (
            <div className="mb-3 border-t border-slate-700 pt-3">
              <div className="text-xs font-bold text-gray-300 mb-1">產業趨勢</div>
              <div className="text-xs text-gray-400 leading-relaxed">{market_analysis.industry_trends}</div>
            </div>
          )}
          {market_analysis?.key_advantages?.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-bold text-cyan-400 mb-1">企業核心護城河</div>
              {market_analysis.key_advantages.map((a, i) => (
                <div key={i} className="mb-2">
                  <div className="text-xs font-semibold text-white">{a.point}</div>
                  {a.description && <div className="text-xs text-gray-500 leading-relaxed">{a.description}</div>}
                </div>
              ))}
            </div>
          )}
          {market_analysis?.potential_risks?.length > 0 && (
            <div>
              <div className="text-xs font-bold text-red-400 mb-1">長期戰略風險</div>
              {market_analysis.potential_risks.map((r, i) => (
                <div key={i} className="mb-2">
                  <div className="text-xs font-semibold text-red-300">{r.point}</div>
                  {r.description && <div className="text-xs text-gray-500 leading-relaxed">{r.description}</div>}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── 5. 面試考題預測（全量） ────────────────────── */}
      <Section
        id="interview" title="🎯 面試考題預測"
        preview={interview_preparation.questions[0]?.question}
        expanded={expanded} onToggle={toggle}
      >
        <div className="space-y-4">
          {interview_preparation.questions.map((q, i) => (
            <div key={i} className="border-l-2 border-violet-500 pl-3">
              <div className="text-xs font-semibold text-white leading-relaxed">{q.question}</div>
              {q.source && <div className="text-xs text-gray-600 mt-0.5">{q.source}</div>}
              {q.answer_guide && (
                <div className="text-xs text-gray-400 mt-1.5 leading-relaxed bg-slate-700/40 rounded-lg p-2">{q.answer_guide}</div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ── 6. 真實面試題目（全量） ──────────────────── */}
      {reviews_analysis?.real_interview_questions?.length > 0 && (
        <Section
          id="real" title="📝 真實面試題目"
          preview={reviews_analysis.real_interview_questions[0]?.question}
          expanded={expanded} onToggle={toggle}
        >
          <div className="space-y-2">
            {reviews_analysis.real_interview_questions.map((q, i) => (
              <div key={i} className="bg-slate-700/50 rounded-lg p-2.5">
                <div className="text-xs font-semibold text-white leading-relaxed">{q.question}</div>
                {q.year && <div className="text-xs text-gray-500 mt-0.5">{q.year}</div>}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen, onClose, jobTitle, companyName, location, salary, jobDescription, language = 'en',
  onApplyWithResume, canApply = false,
}) => {
  const [step, setStep] = useState<'resume' | 'analyzing' | 'result' | 'error'>('resume');
  const [resume, setResume] = useState<ResumeInput | null>(null);
  const [analyzedResumeId, setAnalyzedResumeId] = useState<string | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [lastReportId, setLastReportId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'need_login'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('resume');
    setReport(null);
    setResume(null);
    setAnalyzedResumeId(null);
    setErrorMsg('');
    setErrorCode(null);
    setLastReportId(null);
    setProgress(0);
    loadUserAndResumes();
  }, [isOpen]);

  const loadUserAndResumes = async () => {
    setIsLoadingResumes(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        const { data } = await supabase
          .from('resume_history')
          .select('id, type, content, mime_type, file_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);
        if (data) {
          setSavedResumes(data.map((item: any) => ({
            id: item.id,
            type: item.type,
            content: item.content,
            mimeType: item.mime_type,
            fileName: item.file_name,
            timestamp: new Date(item.created_at).getTime(),
          })));
        }
      }
    } catch {
      // silent
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      setResume({ type: 'file', content: base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const startProgress = () => {
    const startTime = Date.now();
    setProgress(0); setElapsed(0); setStageLabel(getStageLabel(0, language));
    progressTimerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startTime) / 1000);
      const p = getProgressAtTime(s);
      setProgress(p); setElapsed(s); setStageLabel(getStageLabel(p, language));
    }, 400);
  };

  const stopProgress = () => {
    if (progressTimerRef.current) { clearInterval(progressTimerRef.current); progressTimerRef.current = null; }
  };

  const handleAnalyze = async (selectedResume: ResumeInput, savedResumeId?: string) => {
    setAnalyzedResumeId(savedResumeId ?? null);
    setStep('analyzing');
    startProgress();
    try {
      const jdText = `${jobTitle} at ${companyName}\n地點：${location}${salary ? `\n薪資：${salary}` : ''}\n\n${jobDescription}`;
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: jdText, resume: selectedResume, language }),
      });
      const result = await res.json();
      if (!res.ok) {
        const code = result.errorCode as string | undefined;
        setErrorCode(code ?? null);
        setErrorMsg(result.error || ((language === 'zh-TW' || language === 'zh-CN') ? '分析失敗，請稍後再試' : 'Analysis failed, please try again'));
        setStep('error');
        return;
      }
      setReport(result.report);
      if (result.reportId) setLastReportId(result.reportId);
      setStep('result');
    } catch (err: any) {
      setErrorMsg(err.message || '分析失敗，請稍後再試');
      setStep('error');
    } finally {
      stopProgress();
      setProgress(0);
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaveState('need_login');
      setTimeout(() => setSaveState('idle'), 3000);
      return;
    }
    setSaveState('saving');
    try {
      await supabase.from('analysis_reports').insert({
        user_id: user.id,
        job_title: report.basic_analysis.job_title || jobTitle,
        job_description: jobDescription,
        resume_file_name: 'shorts',
        resume_type: 'text',
        analysis_data: report,
        content: JSON.stringify(report),
      });
      setSaveState('saved');
    } catch {
      setSaveState('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" onClick={onClose} />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-3xl border-t border-violet-500/30 shadow-2xl animate-slide-up max-h-[92vh] flex flex-col">

        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-pointer shrink-0" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-600 rounded-full hover:bg-gray-500 transition-colors" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/10 shrink-0">
          <Sparkles size={17} className="text-violet-400 shrink-0" />
          <span className="font-bold text-white text-sm shrink-0">{(language === 'zh-TW' || language === 'zh-CN') ? 'AI 匹配度分析' : 'AI Match Analysis'}</span>
          <span className="text-xs text-gray-400 flex-1 truncate mx-1">{jobTitle} @ {companyName}</span>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors shrink-0">
            <X size={15} className="text-gray-300" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── STEP: resume ─────────────────────────────── */}
          {step === 'resume' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                {(language === 'zh-TW' || language === 'zh-CN')
                  ? `上傳履歷後，AI 將針對「${jobTitle}」生成匹配度分析報告`
                  : `Upload your resume and AI will generate a match analysis for "${jobTitle}"`}
              </p>

              {isLoadingResumes ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
                  <Loader2 size={15} className="animate-spin" /> {(language === 'zh-TW' || language === 'zh-CN') ? '載入儲存的履歷…' : 'Loading saved resumes…'}
                </div>
              ) : savedResumes.length > 0 ? (
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                    <Clock size={11} /> {(language === 'zh-TW' || language === 'zh-CN') ? '使用儲存的履歷（一鍵分析）' : 'Use saved resume (one-click)'}
                  </div>
                  {savedResumes.map((saved) => (
                    <button
                      key={saved.id}
                      onClick={() => handleAnalyze(saved, saved.id)}
                      className="w-full flex items-center gap-3 bg-slate-800 hover:bg-violet-900/40 border border-violet-500/30 rounded-xl p-3 mb-2 transition-all active:scale-95 text-left"
                    >
                      <FileText size={19} className="text-violet-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{saved.fileName || ((language === 'zh-TW' || language === 'zh-CN') ? '文字履歷' : 'Text Resume')}</div>
                        <div className="text-xs text-gray-500">{new Date(saved.timestamp).toLocaleDateString((language === 'zh-TW' || language === 'zh-CN') ? 'zh-TW' : 'en-US')}</div>
                      </div>
                      <span className="text-xs text-violet-400 font-bold shrink-0">{(language === 'zh-TW' || language === 'zh-CN') ? '使用 →' : 'Use →'}</span>
                    </button>
                  ))}
                  <div className="relative flex items-center my-3">
                    <div className="flex-1 border-t border-slate-700" />
                    <span className="px-3 text-xs text-gray-600">{(language === 'zh-TW' || language === 'zh-CN') ? '或上傳新履歷' : 'or upload new'}</span>
                    <div className="flex-1 border-t border-slate-700" />
                  </div>
                </div>
              ) : !isLoggedIn ? (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-3 text-xs text-blue-300 mb-1">
                  💡 {(language === 'zh-TW' || language === 'zh-CN') ? '登入後可儲存履歷，下次免上傳直接分析' : 'Sign in to save your resume for one-click analysis next time'}
                </div>
              ) : null}

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors"
              >
                <Upload size={22} className="text-gray-400" />
                <div className="text-sm text-gray-300 font-semibold">{(language === 'zh-TW' || language === 'zh-CN') ? '點擊上傳履歷' : 'Click to upload resume'}</div>
                <div className="text-xs text-gray-500">{(language === 'zh-TW' || language === 'zh-CN') ? '支援 PDF / DOCX / TXT' : 'Supports PDF / DOCX / TXT'}</div>
                {resume && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-violet-400">
                    <CheckCircle size={12} /> {resume.fileName} {(language === 'zh-TW' || language === 'zh-CN') ? '已選取' : 'selected'}
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} />

              {resume && (
                <button
                  onClick={() => handleAnalyze(resume)}
                  className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles size={17} /> {(language === 'zh-TW' || language === 'zh-CN') ? '開始 AI 匹配度分析' : 'Start AI Match Analysis'}
                </button>
              )}
            </div>
          )}

          {/* ── STEP: analyzing ──────────────────────────── */}
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-10 gap-6">
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 112 112" className="w-28 h-28 -rotate-90">
                  <circle cx="56" cy="56" r="46" fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle
                    cx="56" cy="56" r="46" fill="none" stroke="#7c3aed" strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 46}
                    strokeDashoffset={2 * Math.PI * 46 * (1 - progress / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black text-white">{progress}%</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-white mb-1">{stageLabel}</div>
                <div className="text-xs text-gray-500">
                  {(language === 'zh-TW' || language === 'zh-CN') ? `已用時 ${elapsed} 秒｜通常 30–60 秒` : `${elapsed}s elapsed · usually 30–60s`}
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ── STEP: result ─────────────────────────────── */}
          {step === 'result' && report && (
            <div>
              <CompactReport report={report} />
              <div className="mt-4 mb-2 space-y-2">
                {canApply && analyzedResumeId && onApplyWithResume && (
                  <button
                    type="button"
                    onClick={() => onApplyWithResume(analyzedResumeId)}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles size={15} />
                    {(language === 'zh-TW' || language === 'zh-CN') ? '用此履歷一鍵申請' : 'Apply with this resume'}
                  </button>
                )}
                {saveState === 'need_login' ? (
                  <div className="w-full bg-blue-900/30 border border-blue-500/40 text-blue-300 text-xs font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                    💡 {(language === 'zh-TW' || language === 'zh-CN') ? '請先登入才能儲存報告' : 'Please sign in to save this report'}
                  </div>
                ) : saveState === 'saved' ? (
                  <div className="w-full bg-green-900/30 border border-green-500/40 text-green-300 text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 size={15} /> {(language === 'zh-TW' || language === 'zh-CN') ? '報告已儲存' : 'Report saved'}
                  </div>
                ) : (
                  <button
                    onClick={handleSaveReport}
                    disabled={saveState === 'saving'}
                    className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-gray-300 text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    {saveState === 'saving'
                      ? <><Loader2 size={15} className="animate-spin" /> {(language === 'zh-TW' || language === 'zh-CN') ? '儲存中…' : 'Saving…'}</>
                      : <><BookmarkPlus size={15} /> {(language === 'zh-TW' || language === 'zh-CN') ? '儲存報告' : 'Save Report'}</>
                    }
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP: error ───────────────────────────────── */}
          {step === 'error' && (
            <div className="py-4">
              {(errorCode === 'PAYMENT_REQUIRED' || errorCode === 'RATE_LIMIT_EXCEEDED') ? (
                <QuotaPaywallCard
                  language={language}
                  message={errorMsg}
                  isLoggedIn={isLoggedIn}
                  onDismiss={() => setStep('resume')}
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <div className="text-4xl">😔</div>
                  <div className="text-sm text-red-400 font-semibold">{errorMsg}</div>
                  <button
                    onClick={() => setStep('resume')}
                    className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all active:scale-95"
                  >
                    {(language === 'zh-TW' || language === 'zh-CN') ? '重新嘗試' : 'Try Again'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default AnalysisModal;
