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
  const [recentReports, setRecentReports] = useState<any[]>([]);

  const loadRecentReports = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('⚠️  [Page] 用戶未登入，無法載入報告');
        setRecentReports([]);
        return;
      }
      
      console.log('📊 [Page] 開始載入報告列表...');
      const { data, error } = await supabase
        .from('analysis_reports')
        .select('id, job_title, created_at, analysis_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ [Page] 載入報告失敗:', error.message);
        console.error('❌ [Page] 錯誤詳情:', JSON.stringify(error, null, 2));
        setRecentReports([]);
        return;
      }

      if (data) {
        console.log(`✅ [Page] 成功載入 ${data.length} 份報告`);
        console.log('📋 [Page] 報告列表:', data.map(r => ({
          id: r.id,
          title: r.job_title,
          time: r.created_at
        })));
        
        // 📌 立即更新狀態
        setRecentReports(data);
        console.log('✅ [Page] recentReports 狀態已更新');
      } else {
        console.log('⚠️  [Page] 沒有報告數據');
        setRecentReports([]);
      }
    } catch (e) {
      console.error('❌ [Page] 載入報告異常:', e);
      setRecentReports([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (user) {
        loadRecentReports();
      }
    };
    init();
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      if (session?.user) {
        loadRecentReports();
      }
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
          const errorMsg = `JSON 解析失敗：${result.details || '未知錯誤'}\n\n` +
            (result.hint ? `提示：${result.hint}\n\n` : '') +
            '請檢查瀏覽器控制台查看詳細錯誤信息，或稍後重試。';
          throw new Error(errorMsg);
        }
        throw new Error(result.error || '分析失敗');
      }

      // 1. 設定當前報告
      setReport(result.report);

      // 2. [關鍵修正] 強制手動更新列表，不等待 DB 查詢
      const newReportEntry = {
        id: result.id || Date.now().toString(),
        job_title: result.report.basic_analysis?.job_title || '未命名職位',
        created_at: new Date().toISOString(),
        analysis_data: result.report
      };
      
      // 將新報告直接插入陣列最前方
      setRecentReports(prev => [newReportEntry, ...prev]);

    } catch (err: any) {
      console.error('❌ [Frontend Error]', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (savedReport: any) => {
    setReport(savedReport.report);
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
              reportHistory={recentReports.map(r => ({
                id: r.id,
                timestamp: new Date(r.created_at).getTime(),
                report: r.analysis_data
              }))}
              onSelectHistory={(selectedReport) => {
                setReport(selectedReport.report);
              }}
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