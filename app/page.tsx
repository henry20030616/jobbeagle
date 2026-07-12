'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import InputForm from '@/components/InputForm';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import DogLoading from '@/components/DogLoading';
import FooterSection from '@/components/FooterSection';
import LoginButton from '@/components/LoginButton';
import { createClient } from '@/lib/supabase/browser';
import { InterviewReport, LiteReport, FullReport, UserInputs, ReportType } from '@/types';
import { REPORT_CODES, normalizeReportType } from '@/constants/report-products';
import LiteReportDashboard from '@/components/LiteReportDashboard';
import FullReportDashboard from '@/components/FullReportDashboard';
import { getDeviceFingerprint } from '@/lib/device-fingerprint';
import { ChevronLeft, History, X, ChevronRight, Loader2, Play } from 'lucide-react';
import { useLanguage, AppLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import QuotaPaywallCard from '@/components/QuotaPaywallCard';
import { normalizeLiteReport, isLiteReport, isFullReport, normalizeFullReport } from '@/lib/normalize-lite-report';
import CreditsBadge from '@/components/CreditsBadge';
import ReferralCard from '@/components/ReferralCard';
import type { UserProfile } from '@/types';
import { isShortsEnabled } from '@/constants/features';

interface ReportSummary {
  id: string;
  job_title: string;
  score: number | null;
  language: string;
  created_at: string;
  report_type?: string | null;
  resume_id?: string | null;
  report: InterviewReport | LiteReport | null;
  report_json?: LiteReport | FullReport | InterviewReport | null;
}
// Maps elapsed seconds → simulated progress percentage (capped at 99 until API returns)
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
    { minProgress: 0,  label: '🔍 讀取職缺資訊...' },
    { minProgress: 15, label: '📋 分析職缺要求與條件...' },
    { minProgress: 35, label: '🌐 蒐集市場情報與產業資訊...' },
    { minProgress: 55, label: '💰 比對薪資市場數據...' },
    { minProgress: 72, label: '🔎 評估履歷匹配程度...' },
    { minProgress: 85, label: '🎯 挖掘真實面試情報...' },
    { minProgress: 93, label: '📊 整合戰略報告中...' },
  ],
  'zh-CN': [
    { minProgress: 0,  label: '🔍 读取职位信息...' },
    { minProgress: 15, label: '📋 分析职位要求与条件...' },
    { minProgress: 35, label: '🌐 收集市场情报与行业信息...' },
    { minProgress: 55, label: '💰 对比薪资市场数据...' },
    { minProgress: 72, label: '🔎 评估简历匹配程度...' },
    { minProgress: 85, label: '🎯 挖掘真实面试情报...' },
    { minProgress: 93, label: '📊 整合战略报告中...' },
  ],
  en: [
    { minProgress: 0,  label: '🔍 Reading job description...' },
    { minProgress: 15, label: '📋 Analyzing job requirements...' },
    { minProgress: 35, label: '🌐 Gathering market intelligence...' },
    { minProgress: 55, label: '💰 Benchmarking salary data...' },
    { minProgress: 72, label: '🔎 Evaluating resume match...' },
    { minProgress: 85, label: '🎯 Researching interview insights...' },
    { minProgress: 93, label: '📊 Compiling strategic report...' },
  ],
  es: [
    { minProgress: 0,  label: '🔍 Leyendo descripción del puesto...' },
    { minProgress: 15, label: '📋 Analizando requisitos del trabajo...' },
    { minProgress: 35, label: '🌐 Recopilando inteligencia de mercado...' },
    { minProgress: 55, label: '💰 Comparando datos salariales...' },
    { minProgress: 72, label: '🔎 Evaluando coincidencia del CV...' },
    { minProgress: 85, label: '🎯 Investigando perspectivas de entrevista...' },
    { minProgress: 93, label: '📊 Compilando informe estratégico...' },
  ],
  hi: [
    { minProgress: 0,  label: '🔍 नौकरी विवरण पढ़ा जा रहा है...' },
    { minProgress: 15, label: '📋 नौकरी की आवश्यकताओं का विश्लेषण...' },
    { minProgress: 35, label: '🌐 बाजार की जानकारी एकत्र की जा रही है...' },
    { minProgress: 55, label: '💰 वेतन डेटा की तुलना की जा रही है...' },
    { minProgress: 72, label: '🔎 CV मिलान का मूल्यांकन...' },
    { minProgress: 85, label: '🎯 साक्षात्कार जानकारी शोध किया जा रहा है...' },
    { minProgress: 93, label: '📊 रणनीतिक रिपोर्ट संकलित की जा रही है...' },
  ],
  ar: [
    { minProgress: 0,  label: '🔍 قراءة وصف الوظيفة...' },
    { minProgress: 15, label: '📋 تحليل متطلبات الوظيفة...' },
    { minProgress: 35, label: '🌐 جمع معلومات السوق...' },
    { minProgress: 55, label: '💰 مقارنة بيانات الرواتب...' },
    { minProgress: 72, label: '🔎 تقييم توافق السيرة الذاتية...' },
    { minProgress: 85, label: '🎯 البحث عن معلومات المقابلات...' },
    { minProgress: 93, label: '📊 إعداد التقرير الاستراتيجي...' },
  ],
};

function getStageLabel(progress: number, lang: AppLanguage): string {
  const stages = STAGES[lang] ?? STAGES['en'];
  for (let i = stages.length - 1; i >= 0; i--) {
    if (progress >= stages[i].minProgress) return stages[i].label;
  }
  return stages[0].label;
}

export default function Home() {
  const { language: appLanguage } = useLanguage();
  const language = appLanguage;

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [liteReport, setLiteReport] = useState<LiteReport | null>(null);
  const [fullReport, setFullReport] = useState<FullReport | null>(null);
  const [reportType, setReportType] = useState<ReportType>(REPORT_CODES.JOB_FIT_SNAPSHOT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [lastReportId, setLastReportId] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [extensionJobData, setExtensionJobData] = useState<string | null>(null);

  // Auth + History
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyReports, setHistoryReports] = useState<ReportSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Progress simulation state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data.profile);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const payloadParam = urlParams.get('payload');
      if (payloadParam) {
        window.location.replace(`/confirm?payload=${encodeURIComponent(payloadParam)}`);
        return;
      }

      const ref = urlParams.get('ref');
      if (ref) {
        localStorage.setItem('jb_referral_code', ref);
        setReferralCode(ref);
      } else {
        setReferralCode(localStorage.getItem('jb_referral_code'));
      }

      const fromExtension = urlParams.get('from') === 'extension';
      const encodedJob = urlParams.get('job');
      const jobId = urlParams.get('jobId');

      if (fromExtension && (encodedJob || jobId)) {
        try {
          let rawText = '';
          if (encodedJob) {
            rawText = decodeURIComponent(atob(encodedJob));
          } else if (jobId) {
            rawText = localStorage.getItem(`jobbeagle_job_${jobId}`) || '';
            localStorage.removeItem(`jobbeagle_job_${jobId}`);
          }
          if (rawText) {
            const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
              pageTitle: 'Imported Job',
              pageUrl: window.location.href,
              rawText,
              jobId: jobId || 'extension-import',
            }))));
            window.location.replace(`/confirm?payload=${encodeURIComponent(payload)}`);
            return;
          }
        } catch (e) {
          console.error('Extension redirect failed:', e);
        }
      }

      // OAuth 登入失敗時顯示錯誤（auth/callback 會將錯誤帶回首頁）
      const authError = urlParams.get('auth_error');
      if (authError) {
        const errorDesc = urlParams.get('error_description');
        const msg = errorDesc
          ? decodeURIComponent(errorDesc)
          : (language === 'zh-TW' || language === 'zh-CN') ? '登入發生錯誤，請重試' : 'Login error, please retry';
        setError(msg);
        if (!fromExtension) window.history.replaceState({}, '', '/');
      }

      const checkout = urlParams.get('checkout');
      if (checkout === 'success') {
        const notice =
          language === 'zh-TW' || language === 'zh-CN'
            ? '付款成功！額度已更新，可立即重新分析。'
            : 'Payment successful! Credits updated — run a new analysis anytime.';
        setCheckoutNotice(notice);
        await loadProfile();
        window.history.replaceState({}, '', '/');
      } else if (checkout === 'cancelled') {
        setCheckoutNotice(
          language === 'zh-TW' || language === 'zh-CN' ? '已取消付款。' : 'Checkout cancelled.',
        );
        window.history.replaceState({}, '', '/');
      }
    };
    init();

    // Track login state for history feature
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) loadProfile();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) loadProfile();
      else setUserProfile(null);
      if (!session?.user) setShowHistory(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const startProgressSimulation = (lang: AppLanguage) => {
    const startTime = Date.now();
    setAnalysisProgress(0);
    setAnalysisElapsed(0);
    setAnalysisStage(getStageLabel(0, lang));

    progressTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const prog = getProgressAtTime(elapsed);
      setAnalysisProgress(prog);
      setAnalysisElapsed(elapsed);
      setAnalysisStage(getStageLabel(prog, lang));
    }, 400);
  };

  const stopProgressSimulation = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('analysis_reports')
        .select('id, job_title, score, language, created_at, report_type, report, report_json, resume_id')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) {
        console.error('❌ [History] SELECT error:', error.message);
      }
      setHistoryReports((data || []) as ReportSummary[]);
    } catch (e: any) {
      console.error('❌ [History] Exception:', e?.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleResetToForm = () => {
    setReport(null);
    setLiteReport(null);
    setFullReport(null);
    setError(null);
    setErrorCode(null);
    sessionStorage.removeItem('jb_last_report_id');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async (inputs: UserInputs) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError(
        language === 'zh-TW' || language === 'zh-CN'
          ? '請先 Google 登入後再分析（註冊即送 3 次 Lite）'
          : 'Please sign in with Google first (3 free Lite credits on signup)',
      );
      setErrorCode('AUTH_REQUIRED');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);
    setLiteReport(null);
    setFullReport(null);
    setReport(null);
    startProgressSimulation(language);
    try {
      const fingerprint = await getDeviceFingerprint();
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          jobDescription: inputs.jobDescription,
          resume: inputs.resume,
          language: appLanguage,
          device_fingerprint: fingerprint,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const code = (result.code || result.errorCode) as string | undefined;
        if (code) setErrorCode(code);

        if (code === 'PAYMENT_REQUIRED' || code === 'AUTH_REQUIRED') {
          setError(result.error || t.rateTitle);
          return;
        }

        if (code?.startsWith('JD_')) {
          setError(result.error || t.analysisFailed);
          return;
        }

        setError(
          result.error
            || ((language === 'zh-TW' || language === 'zh-CN') ? '分析失敗' : 'Analysis failed'),
        );
        return;
      }

      if (normalizeReportType(result.report_type) === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE) {
        setFullReport(normalizeFullReport(result.report));
        setLiteReport(null);
        setReport(null);
      } else if (
        normalizeReportType(result.report_type) === REPORT_CODES.JOB_FIT_SNAPSHOT
        && result.report?.match_score != null
      ) {
        setLiteReport(normalizeLiteReport(result.report as LiteReport));
        setFullReport(null);
        setReport(null);
      } else if (isLiteReport(result.report)) {
        setLiteReport(normalizeLiteReport(result.report));
        setFullReport(null);
        setReport(null);
      } else {
        setReport(result.report as InterviewReport);
        setLiteReport(null);
        setFullReport(null);
      }
      if (result.report_id) {
        setLastReportId(result.report_id);
        sessionStorage.setItem('jb_last_report_id', result.report_id);
      }
      await loadProfile();
    } catch (err: unknown) {
      console.error('❌ [Frontend Error]', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      stopProgressSimulation();
      setLoading(false);
      setAnalysisProgress(0);
      setAnalysisElapsed(0);
    }
  };

  const translations: Record<AppLanguage, { backToHome: string; analysisFailed: string; suggestions: string; checkConsole: string; retryLater: string; checkApiKey: string; history: string; historyTitle: string; noHistory: string; unknownJob: string; autoSaved: string; rateTitle: string; exploreShorts: string; exploreShortsDesc: string }> = {
    'zh-TW': { backToHome: '返回首頁列表', analysisFailed: '分析失敗', suggestions: '建議', checkConsole: '檢查瀏覽器控制台 (F12) 查看詳細錯誤信息', retryLater: '稍後重試，可能是 Gemini API 暫時性問題', checkApiKey: '如果持續發生，請檢查 API Key 是否正確', history: '歷史紀錄', historyTitle: '分析歷史紀錄', noHistory: '尚無歷史記錄', unknownJob: '未知職缺', autoSaved: '完成一次分析後會自動儲存', rateTitle: '⏳ 今日免費次數已用完', exploreShorts: '探索 Shorts 職缺影片', exploreShortsDesc: '像刷短影片一樣找工作 · AI 匹配 · 一鍵申請' },
    'zh-CN': { backToHome: '返回首页列表', analysisFailed: '分析失败', suggestions: '建议', checkConsole: '检查浏览器控制台 (F12) 查看详细错误信息', retryLater: '稍后重试，可能是 Gemini API 暂时性问题', checkApiKey: '如果持续发生，请检查 API Key 是否正确', history: '历史记录', historyTitle: '分析历史记录', noHistory: '暂无历史记录', unknownJob: '未知职位', autoSaved: '完成一次分析后会自动保存', rateTitle: '⏳ 今日免费次数已用完', exploreShorts: '探索 Shorts 职位视频', exploreShortsDesc: '像刷短视频一样找工作 · AI 匹配 · 一键申请' },
    en: { backToHome: 'Back to Home', analysisFailed: 'Analysis Failed', suggestions: 'Suggestions', checkConsole: 'Check browser console (F12) for detailed error information', retryLater: 'Retry later, may be a temporary Gemini API issue', checkApiKey: 'If it persists, check if the API Key is correct', history: 'History', historyTitle: 'Analysis History', noHistory: 'No history yet', unknownJob: 'Unknown Job', autoSaved: 'Records are saved after each analysis', rateTitle: '⏳ Daily Free Limit Reached', exploreShorts: 'Explore Job Shorts', exploreShortsDesc: 'Swipe job videos · AI match · One-tap apply' },
    es: { backToHome: 'Volver al Inicio', analysisFailed: 'Análisis Fallido', suggestions: 'Sugerencias', checkConsole: 'Revisa la consola del navegador (F12) para ver el error detallado', retryLater: 'Reintenta más tarde, puede ser un problema temporal de la API de Gemini', checkApiKey: 'Si persiste, verifica si la clave API es correcta', history: 'Historial', historyTitle: 'Historial de Análisis', noHistory: 'Sin historial aún', unknownJob: 'Trabajo Desconocido', autoSaved: 'Los registros se guardan después de cada análisis', rateTitle: '⏳ Límite Diario Alcanzado', exploreShorts: 'Explorar Job Shorts', exploreShortsDesc: 'Desliza videos de empleo · Match IA · Aplicar' },
    hi: { backToHome: 'होम पर वापस जाएं', analysisFailed: 'विश्लेषण विफल', suggestions: 'सुझाव', checkConsole: 'विस्तृत त्रुटि के लिए ब्राउज़र कंसोल (F12) जांचें', retryLater: 'बाद में पुनः प्रयास करें, Gemini API की अस्थायी समस्या हो सकती है', checkApiKey: 'यदि जारी रहे, तो API Key सही है या नहीं जांचें', history: 'इतिहास', historyTitle: 'विश्लेषण इतिहास', noHistory: 'अभी तक कोई इतिहास नहीं', unknownJob: 'अज्ञात नौकरी', autoSaved: 'प्रत्येक विश्लेषण के बाद रिकॉर्ड सहेजे जाते हैं', rateTitle: '⏳ दैनिक मुफ़्त सीमा समाप्त', exploreShorts: 'Job Shorts देखें', exploreShortsDesc: 'नौकरी वीडियो स्वाइप करें · AI मिलान · आवेदन' },
    ar: { backToHome: 'العودة إلى الرئيسية', analysisFailed: 'فشل التحليل', suggestions: 'اقتراحات', checkConsole: 'تحقق من وحدة تحكم المتصفح (F12) لمعرفة تفاصيل الخطأ', retryLater: 'حاول لاحقًا، قد تكون المشكلة مؤقتة في Gemini API', checkApiKey: 'إذا استمرت المشكلة، تحقق من صحة مفتاح API', history: 'السجل', historyTitle: 'سجل التحليلات', noHistory: 'لا يوجد سجل بعد', unknownJob: 'وظيفة غير معروفة', autoSaved: 'يتم حفظ السجلات بعد كل تحليل', rateTitle: '⏳ تم بلوغ الحد المجاني اليومي', exploreShorts: 'استكشف Job Shorts', exploreShortsDesc: 'تصفح فيديوهات الوظائف · تطابق AI · تقديم' },
  };

  const t = translations[language] ?? translations['en'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link href="/" className="shrink-0">
            <span className="text-white font-black text-xl sm:text-2xl tracking-tight">
              <span>Job</span><span className="text-indigo-400">beagle</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="dark" />
            {currentUser && (
              <button
                onClick={() => { setShowHistory(true); loadHistory(); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 hover:text-white hover:border-indigo-500 transition-all"
                title={t.historyTitle}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">{t.history}</span>
              </button>
            )}
            <LoginButton referralCode={referralCode ?? undefined} />
          </div>
        </div>

        {isShortsEnabled() && !report && !liteReport && !fullReport && (
          <Link
            href="/shorts"
            className="mb-8 flex items-center gap-4 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 to-violet-950/60 hover:border-indigo-400/50 hover:from-indigo-900/60 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Play className="w-6 h-6 text-indigo-300 fill-indigo-300/30" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-bold text-sm sm:text-base">{t.exploreShorts}</p>
              <p className="text-slate-400 text-xs sm:text-sm mt-0.5">{t.exploreShortsDesc}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-indigo-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        {showHistory && (
          <div className="fixed inset-0 z-50 flex" onClick={() => setShowHistory(false)}>
            <div className="flex-1" />
            <div
              className="w-full max-w-md h-full bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right"
              onClick={e => e.stopPropagation()}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                <h2 className="text-white font-bold text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  {t.historyTitle}
                </h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Panel body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {historyLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                  </div>
                ) : historyReports.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">{t.noHistory}</p>
                    <p className="text-xs mt-1 opacity-60">{t.autoSaved}</p>
                  </div>
                ) : (
                  historyReports.map(item => {
                    const scoreColor = !item.score ? 'text-slate-400'
                      : item.score >= 80 ? 'text-green-400'
                      : item.score >= 65 ? 'text-yellow-400'
                      : item.score >= 50 ? 'text-orange-400'
                      : 'text-red-400';
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          const payload = item.report_json ?? item.report;
                          if (
                            normalizeReportType(item.report_type) === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
                            || isFullReport(payload)
                          ) {
                            setFullReport(payload as FullReport);
                            setLiteReport(null);
                            setReport(null);
                          } else if (isLiteReport(payload)) {
                            setLiteReport(normalizeLiteReport(payload));
                            setFullReport(null);
                            setReport(null);
                          } else if (payload) {
                            setReport(payload as InterviewReport);
                            setLiteReport(null);
                            setFullReport(null);
                          }
                          setShowHistory(false);
                        }}
                        className="w-full text-left p-4 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm line-clamp-1 group-hover:text-indigo-200 transition-colors">
                              {item.job_title || t.unknownJob}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                              {new Date(item.created_at).toLocaleDateString(language === 'zh-TW' || language === 'zh-CN' ? 'zh-TW' : language === 'es' ? 'es-ES' : language === 'hi' ? 'hi-IN' : language === 'ar' ? 'ar-SA' : 'en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.score != null && (
                              <span className={`text-xl font-black ${scoreColor}`}>{item.score}</span>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
        
        {loading && (
          <DogLoading
            progress={analysisProgress}
            stage={analysisStage}
            elapsed={analysisElapsed}
            language={language}
          />
        )}
        {checkoutNotice && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200">
            {checkoutNotice}
            <button
              type="button"
              className="ml-3 text-emerald-400 hover:text-emerald-300"
              onClick={() => setCheckoutNotice(null)}
            >
              ✕
            </button>
          </div>
        )}
        {error && (errorCode === 'PAYMENT_REQUIRED' || errorCode === 'AUTH_REQUIRED') && (
          <QuotaPaywallCard
            language={language}
            message={error}
            isLoggedIn={!!currentUser}
            onDismiss={() => { setError(null); setErrorCode(null); }}
          />
        )}
        {error && errorCode !== 'PAYMENT_REQUIRED' && errorCode !== 'AUTH_REQUIRED' && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-red-400 font-bold mb-2">❌ {t.analysisFailed}</h3>
                <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono">{error}</pre>
                {(error.includes('JSON 解析失敗') || error.includes('JSON parsing')) && (
                  <div className="mt-3 text-xs text-red-400/80">
                    <p>💡 {t.suggestions}：</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>{t.checkConsole}</li>
                      <li>{t.retryLater}</li>
                      <li>{t.checkApiKey}</li>
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setError(null); setErrorCode(null); }}
                className="ml-4 text-red-400 hover:text-red-300"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {!report && !liteReport && !fullReport ? (
          <div className="max-w-6xl mx-auto">
            {currentUser && userProfile && (
              <div className="mb-6 space-y-3">
                <CreditsBadge profile={userProfile} language={language} />
                <ReferralCard referralCode={userProfile.referral_code} language={language} />
              </div>
            )}
            <InputForm
              onSubmit={handleGenerate} 
              isLoading={loading}
              language={language}
              onLanguageChange={undefined}
              initialJobDescription={extensionJobData || undefined}
              reportType={reportType}
              onReportTypeChange={setReportType}
            />
            <FooterSection language={language} />
          </div>
        ) : (
          <div className="animate-fade-in max-w-6xl mx-auto">
            {liteReport ? (
              <LiteReportDashboard
                report={liteReport}
                language={language}
                onNewAnalysis={handleResetToForm}
              />
            ) : fullReport ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleResetToForm}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
                  >
                    {t.backToHome}
                  </button>
                </div>
                <FullReportDashboard
                  report={normalizeFullReport(fullReport)}
                  language={language}
                  onNewAnalysis={handleResetToForm}
                />
              </div>
            ) : report ? (
              <>
                <button
                  onClick={handleResetToForm}
                  className="mb-6 flex items-center text-slate-400 hover:text-white transition-all active:scale-95 hover:scale-105 group"
                >
                  <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                  {t.backToHome}
                </button>
                <AnalysisDashboard data={report} language={language} />
              </>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}