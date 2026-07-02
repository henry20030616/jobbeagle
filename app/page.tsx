'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import InputForm from '@/components/InputForm';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import DogLoading from '@/components/DogLoading';
import FooterSection from '@/components/FooterSection';
import LoginButton from '@/components/LoginButton';
import { createClient } from '@/lib/supabase/browser';
import { InterviewReport, UserInputs } from '@/types';
import { ChevronLeft, History, X, ChevronRight, Loader2, Play } from 'lucide-react';
import { useLanguage, AppLanguage } from '@/lib/language-context';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface ReportSummary {
  id: string;
  job_title: string;
  score: number | null;
  language: string;
  created_at: string;
  report: InterviewReport;
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
  const { language: appLanguage, setLanguage } = useLanguage();
  const language = appLanguage;

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
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

  useEffect(() => {
    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const fromExtension = urlParams.get('from') === 'extension';
      const encodedJob = urlParams.get('job');
      const jobId = urlParams.get('jobId');
      const source = urlParams.get('source');
      
      if (fromExtension) {
        console.log('🔌 [Extension] 檢測到來自插件，來源:', source);
        
        if (encodedJob) {
          try {
            const decodedData = decodeURIComponent(atob(encodedJob));
            setExtensionJobData(decodedData);
            console.log('✅ [Extension] 已從 URL 解碼職缺數據');
          } catch (e) {
            console.error('❌ [Extension] 解碼失敗:', e);
          }
        } else if (jobId) {
          const storedData = localStorage.getItem(`jobbeagle_job_${jobId}`);
          if (storedData) {
            setExtensionJobData(storedData);
            localStorage.removeItem(`jobbeagle_job_${jobId}`);
            console.log('✅ [Extension] 已從本地存儲讀取職缺數據');
          }
        }
        
        window.history.replaceState({}, '', '/');
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
    };
    init();

    // Track login state for history feature
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUser(session?.user ?? null);
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
        .select('id, job_title, score, language, created_at, report')
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

  const handleGenerate = async (inputs: UserInputs) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    startProgressSimulation(language);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inputs, language: appLanguage }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (result.errorCode) setErrorCode(result.errorCode);
        if (result.error === 'AI Generated Invalid JSON') {
          throw new Error((language === 'zh-TW' || language === 'zh-CN') ? 'AI 生成格式異常,請重試' : 'AI generated invalid format, please retry');
        }
        throw new Error(result.error || ((language === 'zh-TW' || language === 'zh-CN') ? '分析失敗' : 'Analysis failed'));
      }

      setReport(result.report);


    } catch (err: any) {
      console.error('❌ [Frontend Error]', err);
      setError(err.message);
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
    <div className="min-h-screen bg-jb-bg text-jb-ink">
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="shrink-0">
            <span className="font-display text-xl font-semibold tracking-tight text-jb-ink sm:text-2xl">
              Job<span className="text-jb-accent">beagle</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher variant="luxury" />
            {currentUser && (
              <button
                onClick={() => { setShowHistory(true); loadHistory(); }}
                className="jb-interactive flex items-center gap-1.5 rounded-jb border border-jb-border bg-jb-elevated px-3 py-2 text-sm text-jb-ink-muted hover:border-jb-accent/30 hover:text-jb-accent"
                title={t.historyTitle}
              >
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">{t.history}</span>
              </button>
            )}
            <LoginButton />
          </div>
        </div>

        {!report && (
          <Link
            href="/shorts"
            className="jb-interactive mb-10 flex items-center gap-4 rounded-jb-lg border border-jb-border bg-jb-elevated p-4 shadow-jb hover:border-jb-accent/25 hover:shadow-jb-hover sm:p-5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-jb bg-jb-accent-soft">
              <Play className="h-5 w-5 fill-jb-accent/20 text-jb-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-jb-ink sm:text-base">{t.exploreShorts}</p>
              <p className="mt-0.5 text-xs text-jb-ink-muted sm:text-sm">{t.exploreShortsDesc}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-jb-accent" />
          </Link>
        )}

        {showHistory && (
          <div className="fixed inset-0 z-50 flex" onClick={() => setShowHistory(false)}>
            <div className="flex-1" />
            <div
              className="animate-slide-in-right flex h-full w-full max-w-md flex-col overflow-hidden border-l border-jb-border bg-jb-elevated shadow-jb-hover"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-jb-border px-5 py-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-jb-ink">
                  <History className="h-5 w-5 text-jb-accent" />
                  {t.historyTitle}
                </h2>
                <button onClick={() => setShowHistory(false)} className="text-jb-ink-muted hover:text-jb-ink">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {historyLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-jb-accent" />
                  </div>
                ) : historyReports.length === 0 ? (
                  <div className="py-16 text-center text-jb-ink-muted">
                    <History className="mx-auto mb-3 h-12 w-12 opacity-30" />
                    <p className="text-sm">{t.noHistory}</p>
                    <p className="mt-1 text-xs opacity-60">{t.autoSaved}</p>
                  </div>
                ) : (
                  historyReports.map(item => {
                    const scoreColor = !item.score ? 'text-jb-ink-muted'
                      : item.score >= 80 ? 'text-emerald-600'
                      : item.score >= 65 ? 'text-amber-600'
                      : item.score >= 50 ? 'text-orange-600'
                      : 'text-red-600';
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setReport(item.report); setShowHistory(false); }}
                        className="jb-interactive w-full rounded-jb-lg border border-jb-border bg-jb-elevated p-4 text-left hover:border-jb-accent/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold text-jb-ink">
                              {item.job_title || t.unknownJob}
                            </p>
                            <p className="mt-1 text-xs text-jb-ink-subtle">
                              {new Date(item.created_at).toLocaleDateString(language === 'zh-TW' || language === 'zh-CN' ? 'zh-TW' : language === 'es' ? 'es-ES' : language === 'hi' ? 'hi-IN' : language === 'ar' ? 'ar-SA' : 'en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {item.score != null && (
                              <span className={`text-xl font-bold ${scoreColor}`}>{item.score}</span>
                            )}
                            <ChevronRight className="h-4 w-4 text-jb-ink-subtle" />
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
        {error && errorCode === 'RATE_LIMIT_EXCEEDED' && (
          <div className="mb-6 rounded-jb-lg border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-amber-300 font-bold text-lg mb-1">
                  {t.rateTitle}
                </h3>
                <p className="text-amber-200/80 text-sm mb-3">{error}</p>
                <p className="text-xs text-amber-400/60">
                  {(language === 'zh-TW' || language === 'zh-CN')
                    ? '💡 登入帳號可繼續使用，未來將推出無限制的進階方案。'
                    : '💡 Log in to continue. An unlimited premium plan is coming soon.'}
                </p>
              </div>
              <button onClick={() => { setError(null); setErrorCode(null); }} className="ml-4 text-amber-400 hover:text-amber-300">✕</button>
            </div>
          </div>
        )}
        {error && errorCode !== 'RATE_LIMIT_EXCEEDED' && (
          <div className="mb-6 rounded-jb-lg border border-red-200 bg-red-50 p-4">
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

        {!report ? (
          <div>
            <InputForm 
              onSubmit={handleGenerate} 
              isLoading={loading}
              language={language}
              onLanguageChange={setLanguage}
              initialJobDescription={extensionJobData || undefined}
            />
            <FooterSection language={language} compact />
          </div>
        ) : (
          <div className="animate-fade-in">
            <button 
              onClick={() => setReport(null)} 
              className="jb-interactive mb-6 flex items-center text-jb-ink-muted hover:text-jb-accent"
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> 
              {t.backToHome}
            </button>
            <AnalysisDashboard data={report} language={language} />
          </div>
        )}
      </main>
    </div>
  );
}