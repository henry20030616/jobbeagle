'use client';

import { AppLanguage } from '@/lib/language-context';
import React, { useState, useEffect, useRef } from 'react';
import {
  X, Upload, FileText, Sparkles, CheckCircle,
  Loader2, Clock, CheckCircle2
} from 'lucide-react';
import { ResumeInput, LiteReport, FullReport, UserProfile, ReportType } from '@/types';
import { REPORT_CODES, normalizeReportType, reportShortLabel } from '@/constants/report-products';
import { createClient } from '@/lib/supabase/browser';
import QuotaPaywallCard from '@/components/QuotaPaywallCard';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import { normalizeLiteReport } from '@/lib/normalize-lite-report';

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


const AnalysisModal: React.FC<AnalysisModalProps> = ({
  isOpen, onClose, jobTitle, companyName, location, salary, jobDescription, language = 'en',
  onApplyWithResume, canApply = false,
}) => {
  const [step, setStep] = useState<'resume' | 'analyzing' | 'result' | 'error'>('resume');
  const [resume, setResume] = useState<ResumeInput | null>(null);
  const [analyzedResumeId, setAnalyzedResumeId] = useState<string | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingResumes, setIsLoadingResumes] = useState(false);
  const [liteReport, setLiteReport] = useState<LiteReport | null>(null);
  const [fullReport, setFullReport] = useState<FullReport | null>(null);
  const [reportType, setReportType] = useState<ReportType>(REPORT_CODES.JOB_FIT_SNAPSHOT);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [lastReportId, setLastReportId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('resume');
    setLiteReport(null);
    setFullReport(null);
    setReportType(REPORT_CODES.JOB_FIT_SNAPSHOT);
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
        const profileRes = await fetch('/api/profile');
        if (profileRes.ok) {
          const data = await profileRes.json();
          setUserProfile(data.profile);
        }
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
    if (!isLoggedIn) {
      setErrorCode('AUTH_REQUIRED');
      setErrorMsg(
        language === 'zh-TW' || language === 'zh-CN'
          ? '請先 Google 登入後再分析'
          : 'Please sign in with Google first',
      );
      setStep('error');
      return;
    }

    setAnalyzedResumeId(savedResumeId ?? null);
    setStep('analyzing');
    startProgress();
    try {
      const jdText = `${jobTitle} at ${companyName}\nLocation: ${location}${salary ? `\nSalary: ${salary}` : ''}\n\n${jobDescription}`;
      const fingerprint = await getDeviceFingerprint();
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          jobDescription: jdText,
          resume: selectedResume,
          language,
          device_fingerprint: fingerprint,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        const code = (result.code || result.errorCode) as string | undefined;
        setErrorCode(code ?? null);
        setErrorMsg(
          result.error
            || ((language === 'zh-TW' || language === 'zh-CN') ? '分析失敗，請稍後再試' : 'Analysis failed, please try again'),
        );
        setStep('error');
        return;
      }
      if (normalizeReportType(result.report_type) === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE) {
        setFullReport(result.report as FullReport);
        setLiteReport(null);
      } else {
        setLiteReport(normalizeLiteReport(result.report as LiteReport));
        setFullReport(null);
      }
      if (result.report_id) {
        setLastReportId(result.report_id);
        setSaveState('saved');
      }
      setStep('result');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : '分析失敗，請稍後再試');
      setStep('error');
    } finally {
      stopProgress();
      setProgress(0);
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
                <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 mb-1">
                  {(language === 'zh-TW' || language === 'zh-CN')
                    ? '請先 Google 登入才能分析（註冊送 3 次 Job Fit Snapshot）'
                    : 'Sign in with Google to analyze (3 free Job Fit Snapshot credits on signup)'}
                </div>
              ) : null}

              {isLoggedIn && userProfile && (
                (userProfile.available_interview_strategy_guide_credits
                  ?? userProfile.available_full_credits
                  ?? 0) > 0
              ) && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReportType(REPORT_CODES.JOB_FIT_SNAPSHOT)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                      reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'border-slate-600 text-slate-400'
                    }`}
                  >
                    {reportShortLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, language)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportType(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${
                      reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
                        ? 'bg-violet-600 border-violet-500 text-white'
                        : 'border-slate-600 text-slate-400'
                    }`}
                  >
                    {reportShortLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, language)}
                  </button>
                </div>
              )}

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
          {step === 'result' && (liteReport || fullReport) && (
            <div>
              {liteReport && (
                <LiteReportDashboard report={liteReport} language={language} embedded />
              )}
              {fullReport && <FullReportDashboard report={fullReport} embedded />}
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
                {saveState === 'saved' && (
                  <div className="w-full bg-green-900/30 border border-green-500/40 text-green-300 text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
                    <CheckCircle2 size={15} />
                    {(language === 'zh-TW' || language === 'zh-CN') ? '報告已自動儲存至雲端' : 'Report auto-saved to your account'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP: error ───────────────────────────────── */}
          {step === 'error' && (
            <div className="py-4">
              {(errorCode === 'PAYMENT_REQUIRED' || errorCode === 'AUTH_REQUIRED' || errorCode === 'RATE_LIMIT') ? (
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
