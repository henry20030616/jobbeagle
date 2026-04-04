'use client';

import React, { useState, useEffect, useRef } from 'react';
import InputForm from '@/components/InputForm';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import DogLoading from '@/components/DogLoading';
import FooterSection from '@/components/FooterSection';
import LoginButton from '@/components/LoginButton';
import { InterviewReport, UserInputs } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

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

const STAGES: Record<'zh' | 'en', Array<{ minProgress: number; label: string }>> = {
  zh: [
    { minProgress: 0,  label: '🔍 讀取職缺資訊...' },
    { minProgress: 15, label: '📋 分析職缺要求與條件...' },
    { minProgress: 35, label: '🌐 蒐集市場情報與產業資訊...' },
    { minProgress: 55, label: '💰 比對薪資市場數據...' },
    { minProgress: 72, label: '🔎 評估履歷匹配程度...' },
    { minProgress: 85, label: '🎯 挖掘真實面試情報...' },
    { minProgress: 93, label: '📊 整合戰略報告中...' },
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
};

function getStageLabel(progress: number, lang: 'zh' | 'en'): string {
  const stages = STAGES[lang];
  for (let i = stages.length - 1; i >= 0; i--) {
    if (progress >= stages[i].minProgress) return stages[i].label;
  }
  return stages[0].label;
}

export default function Home() {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [extensionJobData, setExtensionJobData] = useState<string | null>(null);

  // Progress simulation state
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisElapsed, setAnalysisElapsed] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      
      // 檢查是否來自插件
      const urlParams = new URLSearchParams(window.location.search);
      const fromExtension = urlParams.get('from') === 'extension';
      const encodedJob = urlParams.get('job');
      const jobId = urlParams.get('jobId');
      const source = urlParams.get('source');
      
      if (fromExtension) {
        console.log('🔌 [Extension] 檢測到來自插件，來源:', source);
        
        if (encodedJob) {
          // 從 URL 參數解碼職缺數據
          try {
            const decodedData = decodeURIComponent(atob(encodedJob));
            setExtensionJobData(decodedData);
            console.log('✅ [Extension] 已從 URL 解碼職缺數據');
          } catch (e) {
            console.error('❌ [Extension] 解碼失敗:', e);
          }
        } else if (jobId) {
          // 從 localStorage 讀取（處理大數據情況）
          const storedData = localStorage.getItem(`jobbeagle_job_${jobId}`);
          if (storedData) {
            setExtensionJobData(storedData);
            localStorage.removeItem(`jobbeagle_job_${jobId}`);
            console.log('✅ [Extension] 已從本地存儲讀取職缺數據');
          }
        }
        
        // 清理 URL（移除參數，保持乾淨）
        window.history.replaceState({}, '', '/');
      }
    };
    init();
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const startProgressSimulation = (lang: 'zh' | 'en') => {
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

  const handleGenerate = async (inputs: UserInputs) => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    startProgressSimulation(language);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (result.errorCode) setErrorCode(result.errorCode);
        if (result.error === 'AI Generated Invalid JSON') {
          throw new Error(language === 'zh' ? 'AI 生成格式異常,請重試' : 'AI generated invalid format, please retry');
        }
        throw new Error(result.error || (language === 'zh' ? '分析失敗' : 'Analysis failed'));
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

  const translations = {
    zh: {
      backToHome: '返回首頁列表',
      analysisFailed: '分析失敗',
      suggestions: '建議',
      checkConsole: '檢查瀏覽器控制台 (F12) 查看詳細錯誤信息',
      retryLater: '稍後重試，可能是 Gemini API 暫時性問題',
      checkApiKey: '如果持續發生，請檢查 API Key 是否正確',
    },
    en: {
      backToHome: 'Back to Home',
      analysisFailed: 'Analysis Failed',
      suggestions: 'Suggestions',
      checkConsole: 'Check browser console (F12) for detailed error information',
      retryLater: 'Retry later, may be a temporary Gemini API issue',
      checkApiKey: 'If it persists, please check if the API Key is correct',
    }
  };

  const t = translations[language];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-end items-center gap-3 mb-6">
          {/* Language Switcher */}
          <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLanguage('zh')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                language === 'zh'
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              中文
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
                language === 'en'
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
          </div>
          <LoginButton />
        </div>
        
        {loading && (
          <DogLoading
            progress={analysisProgress}
            stage={analysisStage}
            elapsed={analysisElapsed}
            language={language}
          />
        )}
        {error && errorCode === 'RATE_LIMIT_EXCEEDED' && (
          <div className="mb-6 p-5 bg-amber-900/20 border border-amber-500/50 rounded-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-amber-300 font-bold text-lg mb-1">
                  {language === 'zh' ? '⏳ 今日免費次數已用完' : '⏳ Daily Free Limit Reached'}
                </h3>
                <p className="text-amber-200/80 text-sm mb-3">{error}</p>
                <p className="text-xs text-amber-400/60">
                  {language === 'zh'
                    ? '💡 登入帳號可繼續使用，未來將推出無限制的進階方案。'
                    : '💡 Log in to continue. An unlimited premium plan is coming soon.'}
                </p>
              </div>
              <button onClick={() => { setError(null); setErrorCode(null); }} className="ml-4 text-amber-400 hover:text-amber-300">✕</button>
            </div>
          </div>
        )}
        {error && errorCode !== 'RATE_LIMIT_EXCEEDED' && (
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

        {!report ? (
          <div className="max-w-4xl mx-auto">
            <InputForm 
              onSubmit={handleGenerate} 
              isLoading={loading}
              language={language}
              onLanguageChange={setLanguage}
              initialJobDescription={extensionJobData || undefined}
            />
            <FooterSection language={language} />
          </div>
        ) : (
          <div className="animate-fade-in">
            <button 
              onClick={() => setReport(null)} 
              className="mb-6 flex items-center text-slate-400 hover:text-white transition-all active:scale-95 hover:scale-105 group"
            >
              <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> 
              {t.backToHome}
            </button>
            <AnalysisDashboard data={report} language={language} />
          </div>
        )}
      </main>
    </div>
  );
}