'use client';

import React, { useState, useEffect, useRef } from 'react';
import InputForm from '@/components/InputForm';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import DogLoading from '@/components/DogLoading';
import FooterSection from '@/components/FooterSection';
import LoginButton from '@/components/LoginButton';
import { createClient } from '@/lib/supabase/browser';
import { InterviewReport, UserInputs } from '@/types';
import { ChevronLeft, History, X, ChevronRight, Loader2 } from 'lucide-react';
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
  ja: [
    { minProgress: 0,  label: '🔍 求人情報を読み込み中...' },
    { minProgress: 15, label: '📋 求人要件を分析中...' },
    { minProgress: 35, label: '🌐 市場情報を収集中...' },
    { minProgress: 55, label: '💰 給与データを比較中...' },
    { minProgress: 72, label: '🔎 履歴書のマッチングを評価中...' },
    { minProgress: 85, label: '🎯 面接情報を調査中...' },
    { minProgress: 93, label: '📊 戦略レポートを作成中...' },
  ],
  ko: [
    { minProgress: 0,  label: '🔍 채용 정보 읽는 중...' },
    { minProgress: 15, label: '📋 채용 요건 분석 중...' },
    { minProgress: 35, label: '🌐 시장 정보 수집 중...' },
    { minProgress: 55, label: '💰 급여 데이터 비교 중...' },
    { minProgress: 72, label: '🔎 이력서 매칭 평가 중...' },
    { minProgress: 85, label: '🎯 면접 정보 조사 중...' },
    { minProgress: 93, label: '📊 전략 보고서 작성 중...' },
  ],
  id: [
    { minProgress: 0,  label: '🔍 Membaca deskripsi pekerjaan...' },
    { minProgress: 15, label: '📋 Menganalisis persyaratan pekerjaan...' },
    { minProgress: 35, label: '🌐 Mengumpulkan intelijen pasar...' },
    { minProgress: 55, label: '💰 Membandingkan data gaji...' },
    { minProgress: 72, label: '🔎 Mengevaluasi kecocokan resume...' },
    { minProgress: 85, label: '🎯 Meneliti wawancara...' },
    { minProgress: 93, label: '📊 Menyusun laporan strategis...' },
  ],
  vi: [
    { minProgress: 0,  label: '🔍 Đọc mô tả công việc...' },
    { minProgress: 15, label: '📋 Phân tích yêu cầu tuyển dụng...' },
    { minProgress: 35, label: '🌐 Thu thập thông tin thị trường...' },
    { minProgress: 55, label: '💰 So sánh dữ liệu lương...' },
    { minProgress: 72, label: '🔎 Đánh giá mức độ phù hợp CV...' },
    { minProgress: 85, label: '🎯 Nghiên cứu thông tin phỏng vấn...' },
    { minProgress: 93, label: '📊 Biên soạn báo cáo chiến lược...' },
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
          : language === 'zh' ? '登入發生錯誤，請重試' : 'Login error, please retry';
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

  const translations: Record<string, { backToHome: string; analysisFailed: string; suggestions: string; checkConsole: string; retryLater: string; checkApiKey: string; history: string; historyTitle: string; noHistory: string }> = {
    zh: { backToHome: '返回首頁列表', analysisFailed: '分析失敗', suggestions: '建議', checkConsole: '檢查瀏覽器控制台 (F12) 查看詳細錯誤信息', retryLater: '稍後重試，可能是 Gemini API 暫時性問題', checkApiKey: '如果持續發生，請檢查 API Key 是否正確', history: '歷史紀錄', historyTitle: '分析歷史紀錄', noHistory: '尚無歷史記錄' },
    en: { backToHome: 'Back to Home', analysisFailed: 'Analysis Failed', suggestions: 'Suggestions', checkConsole: 'Check browser console (F12) for detailed error information', retryLater: 'Retry later, may be a temporary Gemini API issue', checkApiKey: 'If it persists, check if the API Key is correct', history: 'History', historyTitle: 'Analysis History', noHistory: 'No history yet' },
    ja: { backToHome: 'ホームに戻る', analysisFailed: '分析に失敗しました', suggestions: '提案', checkConsole: 'ブラウザコンソール (F12) で詳細なエラーを確認してください', retryLater: '後で再試行してください。Gemini APIの一時的な問題かもしれません', checkApiKey: 'APIキーが正しいか確認してください', history: '履歴', historyTitle: '分析履歴', noHistory: '履歴はまだありません' },
    ko: { backToHome: '홈으로 돌아가기', analysisFailed: '분석 실패', suggestions: '제안', checkConsole: '브라우저 콘솔 (F12)에서 자세한 오류를 확인하세요', retryLater: '나중에 다시 시도하세요. Gemini API의 일시적인 문제일 수 있습니다', checkApiKey: 'API 키가 올바른지 확인하세요', history: '기록', historyTitle: '분석 기록', noHistory: '기록이 없습니다' },
    id: { backToHome: 'Kembali ke Beranda', analysisFailed: 'Analisis Gagal', suggestions: 'Saran', checkConsole: 'Periksa konsol browser (F12) untuk informasi error detail', retryLater: 'Coba lagi nanti, mungkin masalah sementara Gemini API', checkApiKey: 'Jika terus terjadi, periksa apakah API Key sudah benar', history: 'Riwayat', historyTitle: 'Riwayat Analisis', noHistory: 'Belum ada riwayat' },
    vi: { backToHome: 'Quay về Trang chủ', analysisFailed: 'Phân tích thất bại', suggestions: 'Gợi ý', checkConsole: 'Kiểm tra console trình duyệt (F12) để xem lỗi chi tiết', retryLater: 'Thử lại sau, có thể là sự cố tạm thời của Gemini API', checkApiKey: 'Nếu vẫn tiếp tục, kiểm tra API Key có đúng không', history: 'Lịch sử', historyTitle: 'Lịch sử Phân tích', noHistory: 'Chưa có lịch sử' },
  };

  const t = translations[language] ?? translations['en'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-end items-center gap-3 mb-6">
          <LanguageSwitcher variant="dark" />
          {/* History button — only shown when logged in */}
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
          <LoginButton />
        </div>

        {/* ── History Slide-in Panel ── */}
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
                    <p className="text-xs mt-1 opacity-60">{language === 'zh' ? '完成一次分析後會自動儲存' : 'Records are saved after each analysis'}</p>
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
                        onClick={() => { setReport(item.report); setShowHistory(false); }}
                        className="w-full text-left p-4 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm line-clamp-1 group-hover:text-indigo-200 transition-colors">
                              {item.job_title || (language === 'zh' ? '未知職缺' : 'Unknown Job')}
                            </p>
                            <p className="text-slate-500 text-xs mt-1">
                              {new Date(item.created_at).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US', {
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
              onLanguageChange={undefined}
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