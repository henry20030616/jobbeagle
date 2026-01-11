'use client';

import React, { useState, useEffect } from 'react';
import InputForm from '@/components/InputForm';
import AnalysisDashboard from '@/components/AnalysisDashboard';
import DogLoading from '@/components/DogLoading';
import LoginButton from '@/components/LoginButton';
import { InterviewReport, UserInputs } from '@/types';
import { ChevronLeft, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

interface SavedReport {
  id: string;
  timestamp: number;
  report: InterviewReport;
  job_title?: string;
}

interface RecentReport {
  id: string;
  job_title: string;
  created_at: string;
  analysis_data: InterviewReport;
}

export default function Home() {
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [reportHistory, setReportHistory] = useState<SavedReport[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 頁面初始載入狀態
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 檢查 URL 中是否有 OAuth 錯誤參數
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('auth_error');
    const errorDescription = urlParams.get('error_description');
    
    if (authError) {
      let errorMsg = '登入過程中發生錯誤';
      if (errorDescription) {
        errorMsg = decodeURIComponent(errorDescription);
      }
      setError(`認證錯誤：${errorMsg}`);
      
      // 清除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 頁面載入時，先檢查 session，然後載入歷史紀錄
    const initializeData = async () => {
      setIsLoading(true);
      
      // 設定超時：如果 10 秒內沒有完成，強制結束載入
      const timeoutId = setTimeout(() => {
        console.warn('⚠️ 初始化超時，強制結束載入狀態');
        setIsLoading(false);
        setError('載入時間過長，請重新整理頁面或檢查網路連線');
      }, 10000);

      try {
        const supabase = createClient();
        
        // 使用 Promise.race 添加超時保護
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('獲取用戶資訊超時')), 5000)
        );
        
        let user = null;
        try {
          const result = await Promise.race([getUserPromise, timeoutPromise]) as any;
          user = result?.data?.user || null;
        } catch (timeoutError: any) {
          console.warn('⚠️ 獲取用戶資訊超時或失敗:', timeoutError.message);
          // 超時時繼續執行，不阻止頁面載入
        }
        
        setIsLoggedIn(!!user); // 設定登入狀態

        // 使用 Promise.allSettled 確保即使某個請求失敗也能繼續
        const results = await Promise.allSettled([
          loadReportHistory(),
          loadRecentReports()
        ]);

        // 檢查結果
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`載入歷史紀錄失敗 (${index === 0 ? 'reportHistory' : 'recentReports'}):`, result.reason);
          }
        });
      } catch (error: any) {
        console.error('❌ 初始化資料時發生錯誤:', error);
        // 即使出錯也顯示頁面，不要卡在載入狀態
        setError('載入資料時發生錯誤，但您可以繼續使用應用程式');
      } finally {
        clearTimeout(timeoutId);
        // 無論成功或失敗，都將 isLoading 設為 false
        setIsLoading(false);
      }
    };

    initializeData();

    // 監聽認證狀態變化（使用獨立的 supabase 實例避免衝突）
    let mounted = true;
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return; // 如果組件已卸載，不執行
      
      const isLoggedIn = !!session?.user;
      setIsLoggedIn(isLoggedIn);
      
      if (isLoggedIn) {
        // 用戶登入時，重新載入報告（使用 Promise.allSettled 避免阻塞）
        Promise.allSettled([
          loadReportHistory(),
          loadRecentReports()
        ]).then((results) => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.warn(`認證狀態變化後載入失敗 (${index === 0 ? 'reportHistory' : 'recentReports'}):`, result.reason);
            }
          });
        });
      } else {
        // 用戶登出時，清空報告列表
        setReportHistory([]);
        setRecentReports([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadReportHistory = async () => {
    try {
      const supabase = createClient();
      
      // 添加超時保護
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('獲取用戶資訊超時')), 3000)
      );
      
      let user = null;
      try {
        const result = await Promise.race([getUserPromise, timeoutPromise]) as any;
        user = result?.data?.user || null;
      } catch (error: any) {
        console.warn('⚠️ 獲取用戶資訊失敗，跳過載入歷史紀錄:', error.message);
        setReportHistory([]);
        return;
      }
      
      // 如果沒有用戶，不執行查詢
      if (!user) {
        setReportHistory([]);
        return;
      }

      // 添加查詢超時保護
      const queryPromise = supabase
        .from('analysis_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const queryTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('查詢超時')), 5000)
      );

      const { data, error } = await Promise.race([
        queryPromise,
        queryTimeout
      ]) as any;

      if (error) {
        console.error("❌ 載入報告歷史失敗:", error);
        setReportHistory([]);
        return;
      }

      if (data) {
        setReportHistory(data.map((item: any) => ({
          id: item.id,
          timestamp: new Date(item.created_at).getTime(),
          report: item.analysis_data || item.report_data,
          job_title: item.job_title
        })));
      } else {
        setReportHistory([]);
      }
    } catch (e: any) {
      console.error("❌ 載入報告歷史時發生例外:", e.message || e);
      setReportHistory([]);
    }
  };

  const loadRecentReports = async () => {
    try {
      const supabase = createClient();
      
      // 添加超時保護
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('獲取用戶資訊超時')), 3000)
      );
      
      let user = null;
      try {
        const result = await Promise.race([getUserPromise, timeoutPromise]) as any;
        user = result?.data?.user || null;
      } catch (error: any) {
        console.warn('⚠️ 獲取用戶資訊失敗，跳過載入近期報告:', error.message);
        setRecentReports([]);
        return;
      }
      
      // 如果沒有用戶，不執行查詢
      if (!user) {
        setRecentReports([]);
        return;
      }

      // 添加查詢超時保護
      const queryPromise = supabase
        .from('analysis_reports')
        .select('id, job_title, created_at, analysis_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      const queryTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('查詢超時')), 5000)
      );

      const { data, error } = await Promise.race([
        queryPromise,
        queryTimeout
      ]) as any;

      if (error) {
        console.error("❌ 載入近期報告失敗:", error);
        setRecentReports([]);
        return;
      }

      if (data) {
        setRecentReports(data.map((item: any) => ({
          id: item.id,
          job_title: item.job_title || '未命名職位',
          created_at: item.created_at,
          analysis_data: item.analysis_data || {}
        })));
      } else {
        setRecentReports([]);
      }
    } catch (e: any) {
      console.error("❌ 載入近期報告時發生例外:", e.message || e);
      setRecentReports([]);
    }
  };

  const handleGenerate = async (inputs: UserInputs) => {
    setLoading(true);
    setIsLoading(true); // AI 正在分析時，顯示 Loading 動畫
    setError(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        // 先取得錯誤文字，不要直接執行 response.json()
        const errorText = await response.text();
        console.error('API 錯誤回應:', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText,
        });

        // 嘗試解析為 JSON，如果失敗則使用原始文字
        let errorMessage = 'Failed to generate analysis';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // 如果不是 JSON，使用原始文字
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      setReport(result.report);
      await Promise.all([
        loadReportHistory(),
        loadRecentReports()
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "發生未知錯誤，無法完成分析，請稍後再試。");
    } finally {
      setLoading(false);
      setIsLoading(false); // AI 分析完成，隱藏 Loading 動畫
    }
  };

  const handleSelectHistory = (selected: SavedReport) => {
    setReport(selected.report);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewReport = (recentReport: RecentReport) => {
    setReport(recentReport.analysis_data);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setReport(null);
    setError(null);
  };

  // ReportCard 組件：用於顯示每筆近期報告
  const ReportCard: React.FC<{ report: RecentReport; onView: (report: RecentReport) => void }> = ({ report, onView }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const matchScore = report.analysis_data?.match_analysis?.score || 'N/A';
    
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden transition-all hover:border-indigo-500/50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 hover:bg-slate-900 hover:border-indigo-500/50 transition-all group text-left flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors truncate">
              {report.job_title}
            </h3>
            <div className="flex items-center mt-2 text-sm text-slate-400">
              <Clock className="w-4 h-4 mr-1" />
              <span>{new Date(report.created_at).toLocaleString('zh-TW')}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-4">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
            <div className="mb-4">
              <p className="text-sm text-slate-400 mb-2">匹配分數</p>
              <p className="text-2xl font-bold text-indigo-400">
                {matchScore} 分
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => onView(report)}
                className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>查看完整報告</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* 當頁面載入時，顯示 DogLoading 並隱藏其他內容 */}
      {isLoading && <DogLoading />}

      {/* 當載入完成後，顯示完整介面 */}
      {!isLoading && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 登入按鈕 - 放在右上角 */}
          <div className="flex justify-end mb-6">
            <LoginButton />
          </div>

          {error && (
            <div className="mb-6 bg-red-900/30 border border-red-500/50 text-red-200 p-4 rounded-lg flex items-center animate-pulse">
               <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               {error}
            </div>
          )}

          {/* 近期分析報告區塊 - 僅在登入時顯示 */}
          {isLoggedIn && !report && recentReports.length > 0 && (
            <div className="mb-8 bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="w-1.5 h-8 bg-indigo-500 rounded-full mr-4"></span>
                  近期分析報告
                </h2>
                <span className="text-sm text-slate-400">
                  共 {recentReports.length} 筆
                </span>
              </div>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onView={handleViewReport}
                  />
                ))}
              </div>
            </div>
          )}

          {isLoggedIn && !report && recentReports.length === 0 && (
            <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center">
              <p className="text-slate-400 text-lg">
                尚未有分析報告，開始您的第一次分析吧！
              </p>
            </div>
          )}

          {!report ? (
            <div className="max-w-6xl mx-auto animate-fade-in">
               <InputForm 
                onSubmit={handleGenerate} 
                isLoading={loading} 
                reportHistory={reportHistory}
                onSelectHistory={handleSelectHistory}
               />
            </div>
          ) : (
            <div>
              <button 
                onClick={handleReset}
                className="mb-6 flex items-center text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                返回首頁
              </button>
              <AnalysisDashboard data={report} />
            </div>
          )}
        </main>
      )}
    </div>
  );
}
