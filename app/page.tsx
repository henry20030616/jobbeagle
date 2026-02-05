'use client';

import React, { useState, useEffect } from 'react';
import InputForm from '@/components/InputForm';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import DogLoading from '@/components/DogLoading';
import LoginButton from '@/components/LoginButton';
import { InterviewReport, UserInputs } from '@/types';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

export default function Home() {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    init();
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGenerate = async (inputs: UserInputs) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });

      const result = await response.json();
      
      if (!response.ok) {
        if (result.error === 'AI Generated Invalid JSON') {
          throw new Error(language === 'zh' ? 'AI 生成格式異常,請重試' : 'AI generated invalid format, please retry');
        }
        throw new Error(result.error || (language === 'zh' ? '分析失敗' : 'Analysis failed'));
      }

      // 設定當前報告
      setReport(result.report);

    } catch (err: any) {
      console.error('❌ [Frontend Error]', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
          <div className="flex items-center gap-4">
            <a
              href="/employer/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-600 rounded-lg hover:border-slate-500"
            >
              企业登录
            </a>
            <LoginButton />
          </div>
        </div>
        
        {loading && <DogLoading />}
        {error && (
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
                onClick={() => setError(null)}
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
            />
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