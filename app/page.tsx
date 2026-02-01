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
          throw new Error('AI 生成格式異常,請重試');
        }
        throw new Error(result.error || '分析失敗');
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-6"><LoginButton /></div>
        
        {loading && <DogLoading />}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-red-400 font-bold mb-2">❌ 分析失敗</h3>
                <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono">{error}</pre>
                {error.includes('JSON 解析失敗') && (
                  <div className="mt-3 text-xs text-red-400/80">
                    <p>💡 建議：</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>檢查瀏覽器控制台 (F12) 查看詳細錯誤信息</li>
                      <li>稍後重試，可能是 Gemini API 暫時性問題</li>
                      <li>如果持續發生，請檢查 API Key 是否正確</li>
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
              返回首頁列表
            </button>
            <AnalysisDashboard data={report} />
          </div>
        )}
      </main>
    </div>
  );
}