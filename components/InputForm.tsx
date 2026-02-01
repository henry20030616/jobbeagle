'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserInputs, ResumeInput, InterviewReport } from '@/types';
import { FileText, Upload, X, Sparkles, Zap, Globe, AlertTriangle, History, Clock, ArrowRight, Save, MessageSquare, Briefcase, TrendingUp } from 'lucide-react';
import { BeagleIcon } from './AnalysisDashboard';
import { createClient } from '@/lib/supabase/browser';

interface SavedResume extends ResumeInput {
  id: string;
  timestamp: number;
}

interface InputFormProps {
  onSubmit: (inputs: UserInputs) => void;
  isLoading: boolean;
  language?: 'zh' | 'en';
  onLanguageChange?: (lang: 'zh' | 'en') => void;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, language = 'zh', onLanguageChange }) => {
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>(language);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState<ResumeInput | null>(null);
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [resumeHistory, setResumeHistory] = useState<SavedResume[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResumeHistory();
  }, []);

  const loadResumeHistory = async () => {
    try {
      const supabase = createClient();
      // 先檢查用戶是否登入
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        // 未登入，安靜地停止，不執行查詢，不顯示錯誤
        setResumeHistory([]);
        return;
      }

      // 確保只查詢當前用戶的履歷（RLS 應該會自動過濾，但我們明確指定以確保安全）
      const { data, error } = await supabase
        .from('resume_history')
        .select('id, type, content, mime_type, file_name, created_at')
        .eq('user_id', user.id) // 明確過濾當前用戶的資料
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        // 檢查是否為資料表不存在的錯誤
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('resume_history 資料表尚未建立');
          setResumeHistory([]);
          return;
        }
        // 其他錯誤只記錄在 console（warn 而非 error），不顯示給用戶
        console.warn("無法載入履歷歷史（可能是權限問題）", {
          error: JSON.stringify(error, null, 2),
          message: error.message,
          code: error.code,
        });
        setResumeHistory([]);
        return;
      }

      // 處理資料：空陣列是正常情況（新用戶），不應該觸發錯誤
      if (data && Array.isArray(data)) {
        const mappedData = data
          .filter(item => item.id && item.content && item.created_at) // 確保必要欄位存在
          .map((item: any) => ({
            id: item.id,
            type: item.type,
            content: item.content,
            mimeType: item.mime_type,
            fileName: item.file_name,
            timestamp: new Date(item.created_at).getTime()
          }));

        setResumeHistory(mappedData);
      } else {
        // 如果 data 為 null 或 undefined，設為空陣列（正常情況）
        setResumeHistory([]);
      }
    } catch (e: any) {
      // 只有在非預期的錯誤時才記錄（使用 warn 而非 error，避免顯示紅字）
      console.warn("載入履歷歷史時發生非預期錯誤", {
        error: JSON.stringify(e, null, 2),
        message: e?.message,
        code: e?.code,
      });
      setResumeHistory([]); // 發生錯誤時設為空陣列，避免 UI 錯誤
    }
  };

  // 格式化時間：2026/1/17 21:30
  const formatDateTime = (dateStr: string | number) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const urlRegex = /^(https?:\/\/[^\s]+)$/;
    if (urlRegex.test(jobDescription.trim())) {
      setInputType('url');
    } else {
      setInputType('text');
    }
  }, [jobDescription]);

  const saveResumeToHistory = async (newResume: ResumeInput) => {
    const startTime = Date.now();
    try {
      const supabase = createClient();
      
      // 快速獲取用戶信息（使用緩存的 session）
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user || !user.id) {
        console.log('User not logged in, skipping resume save.');
        // 靜默失敗，不打斷用戶流程
        return;
      }

      // ============================================
      // 欄位對齊：確保插入資料的物件欄位名稱與資料庫完全一致
      // 資料庫欄位：user_id, type, content, mime_type, file_name, created_at
      // 注意：不要使用 job_title, analysis_data 等錯誤欄位（這些是 analysis_reports 表的欄位）
      // ============================================
      const insertPayload = {
        user_id: user.id, // 必須使用 user_id (底線格式)
        type: newResume.type,
        content: newResume.content, // 必須使用 content (小寫)
        mime_type: newResume.mimeType, // 必須使用 mime_type (底線格式)
        file_name: newResume.fileName || 'unknown', // 必須使用 file_name (底線格式)
        created_at: new Date().toISOString(),
      };

      // 優化：不等待 select 返回，加快保存速度
      const { error } = await supabase
        .from('resume_history')
        .insert(insertPayload);

      const duration = Date.now() - startTime;
      
      if (error) {
        console.error('❌ 儲存履歷失敗:', error.message);
        // 靜默失敗，僅在控制台記錄
        return;
      }

      // 成功
      console.log(`✅ 履歷儲存成功 (${duration}ms)`);
      
      // 異步刷新列表，不阻塞UI
      loadResumeHistory().catch(e => console.warn('刷新履歷列表失敗:', e));
      
      // 顯示成功提示
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
      
    } catch (e: any) {
      console.error('❌ 儲存履歷時發生例外:', e?.message);
      // 靜默失敗，不打斷用戶
    }
  };

  const handleManualSave = async () => {
    if (resume && !isSaving) {
      setIsSaving(true);
      try {
        await saveResumeToHistory(resume);
      } finally {
        setIsSaving(false);
      }
    }
  };

  useEffect(() => {
    if (language !== currentLanguage) {
      setCurrentLanguage(language);
    }
  }, [language]);

  const handleLanguageChange = (lang: 'zh' | 'en') => {
    setCurrentLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resume) {
      // 不在提交時重複保存履歷，節省時間
      // 履歷已經在上傳時或手動儲存時保存過
      onSubmit({ jobDescription, resume, language: currentLanguage });
      // 報告列表會在 useEffect 中自動刷新（當 isLoading 變為 false 時）
    }
  };

  const handleSelectResume = (saved: SavedResume) => {
    setResume({
      type: saved.type,
      content: saved.content,
      mimeType: saved.mimeType,
      fileName: saved.fileName
    });
    setShowHistoryDropdown(false);
  };

  const handleDeleteResume = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const supabase = createClient();
      // 先檢查用戶是否登入
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user || !user.id) {
        console.warn('User not logged in, skipping resume delete.');
        return;
      }

      // 確保只刪除自己的履歷
      const { error } = await supabase
        .from('resume_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        const errorString = JSON.stringify(error, null, 2);
        const errorMessage = error.message || '未知錯誤';
        const errorCode = error.code || 'UNKNOWN';

        console.error('❌ 刪除履歷失敗');
        console.error('錯誤代碼:', errorCode);
        console.error('錯誤訊息:', errorMessage);
        console.error('完整錯誤物件:', errorString);

        if (errorCode === '42501' || errorMessage?.includes('permission denied')) {
          console.warn('沒有權限刪除履歷，請檢查 RLS policies');
          alert('沒有權限刪除履歷，請檢查 RLS policies 設定');
          return;
        }
        alert('刪除失敗：' + (errorMessage || '未知錯誤'));
        return;
      }
      
      await loadResumeHistory();
    } catch (e: any) {
      const errorString = JSON.stringify(e, null, 2);
      const errorMessage = e?.message || '未知例外';
      console.error('❌ 刪除履歷時發生例外');
      console.error('例外訊息:', errorMessage);
      console.error('完整例外物件:', errorString);
      alert('刪除履歷時發生非預期錯誤：' + errorMessage);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("檔案大小超過 4MB，請上傳較小的檔案。");
      return;
    }

    const processFile = (result: string, isPdf: boolean) => {
      setResume({
        type: isPdf ? 'file' : 'text',
        content: result,
        mimeType: isPdf ? 'application/pdf' : undefined,
        fileName: file.name
      });
    };

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64String = result.split(',')[1];
        processFile(base64String, true);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        processFile(text, false);
      };
      reader.readAsText(file);
    }
  };

  const clearFile = () => {
    setResume(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const translations = {
    zh: {
      title: 'Jobbeagle',
      subtitle: '(職位分析米格魯)',
      description: '專家級 AI 職缺戰略分析中心：結合求職專家分析與獵頭視角，助您掌握應對策略。',
      jobDescription: '職缺描述 (JD)',
      resume: '履歷',
      upload: '點擊上傳 PDF 或文字檔',
      save: '儲存',
      saving: '儲存中...',
      saved: '✓ 已儲存!',
      saveFailed: '儲存失敗，請重試',
      generate: '啟動AI戰略分析',
      resumeLibrary: '履歷庫',
      recentReports: '近期分析報告',
      noResume: '尚未儲存任何履歷',
      recentlyUploaded: '最近上傳的履歷',
      // ... 更多翻译
    },
    en: {
      title: 'Jobbeagle',
      subtitle: '(Job Analysis Beagle)',
      description: 'Expert-level AI Job Strategy Analysis Center: Combining career expert analysis with headhunter perspective to help you master response strategies.',
      jobDescription: 'Job Description (JD)',
      resume: 'Resume',
      upload: 'Click to upload PDF or text file',
      save: 'Save',
      saving: 'Saving...',
      saved: '✓ Saved!',
      saveFailed: 'Save failed, please try again',
      generate: 'Launch AI Strategy Analysis',
      resumeLibrary: 'Resume Library',
      recentReports: 'Recent Analysis Reports',
      noResume: 'No resumes saved yet',
      recentlyUploaded: 'Recently uploaded resumes',
      // ... 更多翻译
    }
  };

  const t = translations[currentLanguage];

  return (
    <div className="flex flex-col gap-10">
      {/* Language Switcher */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center space-x-2 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => handleLanguageChange('zh')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              currentLanguage === 'zh'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            中文
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              currentLanguage === 'en'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="text-center space-y-3 py-4">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight flex flex-col md:flex-row items-center justify-center">
          <div className="flex items-center">
            <div className="mr-6">
               <BeagleIcon className="w-16 h-16 md:w-28 md:h-28 drop-shadow-xl" color="#cbd5e1" spotColor="#5d4037" bellyColor="#94a3b8" />
            </div>
            <span>{t.title}</span>
          </div>
          <span className="text-xl md:text-3xl font-medium text-slate-500 mt-2 md:mt-0 md:ml-6 tracking-normal">
            {t.subtitle}
          </span>
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto font-medium">
          {t.description}
        </p>

      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden flex flex-col h-full relative group">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
              <Sparkles className="w-64 h-64 text-indigo-500" />
           </div>

           <div className="p-8 pb-6">
               <h2 className="text-2xl font-bold text-white flex items-center mb-5">
                  <span className="w-1.5 h-8 bg-blue-500 rounded-full mr-4"></span>
                  戰略引擎簡介
               </h2>
               <p className="text-slate-300 text-lg leading-8 mb-6 bg-slate-700/30 p-5 rounded-xl border border-slate-600/30 font-medium">
                  Jobbeagle 搭載 30 年頂級人資與求職專家分析邏輯，深度解析 JD 背後的組織需求與市場格局。不只評估匹配度，更為您提供具備商業深度的薪資情報與攻防建議。
               </p>
           </div>

           <div className="px-8">
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
           </div>

           <div className="p-8 pt-6 flex-1 flex flex-col">
               <h2 className="text-2xl font-bold text-white flex items-center mb-6">
                  <span className="w-1.5 h-8 bg-emerald-500 rounded-full mr-4"></span>
                  深度報告產出項
               </h2>
               
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start p-4 rounded-xl hover:bg-slate-700/30 transition-colors">
                     <div className="bg-yellow-500/20 p-2.5 rounded-lg mr-4 shrink-0 mt-1">
                        <Zap className="w-6 h-6 text-yellow-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-bold text-slate-200 mb-1">人才職位匹配分析</span>
                       <span className="text-sm text-slate-400 leading-normal">揭示職位隱藏門檻，精準評估您的核心優勢與缺口。</span>
                     </div>
                  </div>
                  
                  <div className="flex items-start p-4 rounded-xl hover:bg-slate-700/30 transition-colors">
                     <div className="bg-emerald-500/20 p-2.5 rounded-lg mr-4 shrink-0 mt-1">
                        <Briefcase className="w-6 h-6 text-emerald-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-bold text-slate-200 mb-1">薪酬體系與評價深度研究</span>
                       <span className="text-sm text-slate-400 leading-normal">提供客觀市場估值、談判籌碼分析及員工真實反饋。</span>
                     </div>
                  </div>

                  <div className="flex items-start p-4 rounded-xl hover:bg-slate-700/30 transition-colors">
                     <div className="bg-sky-500/20 p-2.5 rounded-lg mr-4 shrink-0 mt-1">
                        <TrendingUp className="w-6 h-6 text-sky-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-bold text-slate-200 mb-1">產業格局與競爭者分析</span>
                       <span className="text-sm text-slate-400 leading-normal">從求職專家視角解析公司的市場護城河與未來風險。</span>
                     </div>
                  </div>

                  <div className="flex items-start p-4 rounded-xl hover:bg-slate-700/30 transition-colors">
                     <div className="bg-indigo-500/20 p-2.5 rounded-lg mr-4 shrink-0 mt-1">
                        <MessageSquare className="w-6 h-6 text-indigo-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-bold text-slate-200 mb-1">高階面試模擬與對策</span>
                       <span className="text-sm text-slate-400 leading-normal">網羅真實考題並提供具備深度邏輯的 STAR 回答引導。</span>
                     </div>
                  </div>
               </div>
           </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full relative">
          <div className="p-6 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center mb-5">
                <span className="w-1.5 h-8 bg-indigo-500 rounded-full mr-4"></span>
                1. 職缺資訊 (Job Data)
              </h2>
              <label className="block text-base font-medium text-slate-300 mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                  {inputType === 'url' ? (
                      <Globe className="w-5 h-5 mr-2 text-blue-400 animate-pulse" />
                  ) : (
                      <FileText className="w-5 h-5 mr-2 text-indigo-400" />
                  )}
                  輸入職缺網址或貼上全文
                  </div>
              </label>
              <div className="relative">
                  <textarea
                  required
                  className={`w-full min-h-[180px] bg-slate-900 border rounded-xl p-5 text-base text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y ${
                      inputType === 'url' ? 'border-blue-500/50 text-blue-100' : 'border-slate-700'
                  }`}
                  placeholder="在此貼上職缺網址 (如 104, LinkedIn...) 或是職缺描述內容..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  />
                  {inputType === 'url' && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-start p-2 bg-blue-900/40 rounded border border-blue-500/30 text-sm text-blue-200 backdrop-blur-sm">
                      <AlertTriangle className="w-4 h-4 mr-2 shrink-0 text-blue-400 mt-0.5" />
                      <span>建議：若為需登入網站，貼上全文能讓分析更準確。</span>
                  </div>
                  )}
              </div>
          </div>

          <div className="px-6">
             <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2" />
          </div>

          <div className="p-6 pt-4 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="w-1.5 h-8 bg-violet-500 rounded-full mr-4"></span>
                  2. 您的履歷 (Resume)
                </h2>
                {/* 履歷庫按鈕 */}
                <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                        className="flex items-center space-x-2 text-sm text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-2.5 rounded-full border border-indigo-500/20 transition-all active:scale-95 hover:scale-105 whitespace-nowrap"
                      >
                        <History className="w-4 h-4" />
                        <span className="font-bold">履歷庫 {resumeHistory.length > 0 && `(${resumeHistory.length})`}</span>
                      </button>
                    {showHistoryDropdown && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowHistoryDropdown(false)} />
                        <div className="absolute right-0 top-10 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-20 animate-fade-in overflow-hidden">
                        <div className="p-3 bg-slate-900/80 border-b border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            最近上傳的履歷
                        </div>
                        {resumeHistory.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">
                                <p>尚未儲存任何履歷</p>
                            </div>
                        ) : (
                            resumeHistory.map((historyItem) => (
                            <div key={historyItem.id} onClick={() => handleSelectResume(historyItem)} className="p-4 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 group relative flex items-start transition-all active:bg-slate-600">
                                <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 mr-3 group-hover:scale-110 transition-transform" />
                                <div className="flex-1 overflow-hidden text-left">
                                <p className="text-sm text-slate-200 font-bold truncate group-hover:text-indigo-300 transition-colors">{historyItem.fileName}</p>
                                <p className="text-[10px] text-slate-500 flex items-center mt-1"><Clock className="w-3.5 h-3.5 mr-1" />{formatDateTime(historyItem.timestamp)}</p>
                                </div>
                                <button onClick={(e) => handleDeleteResume(e, historyItem.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all active:scale-90"><X className="w-4 h-4" /></button>
                            </div>
                            ))
                        )}
                        </div>
                    </>
                    )}
                </div>
              </div>

              <div className="mb-6 flex-1">
                  {!resume ? (
                    <div className="w-full h-full min-h-[180px] border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center bg-slate-900/30 transition-all">
                        <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700/30 w-full p-6 flex-1 rounded-t-xl group">
                            <div className="p-4 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 transition-colors mb-3 border border-slate-700 group-hover:border-indigo-500/30">
                                <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                            </div>
                            <p className="text-base text-slate-300 font-bold">點擊上傳 PDF 或文字檔</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium">支援 .pdf, .txt, .md (Max 4MB)</p>
                        </div>
                    </div>
                  ) : (
                     <div className="w-full bg-indigo-900/20 border border-indigo-500/50 rounded-xl flex items-center justify-between p-6 animate-fade-in h-auto">
                       <div className="flex items-center space-x-4 overflow-hidden">
                         <div className="bg-indigo-500 p-3 rounded-lg shrink-0 shadow-lg"><FileText className="w-8 h-8 text-white" /></div>
                         <div className="min-w-0 text-left"><p className="text-base font-bold text-white truncate">{resume.fileName}</p><p className="text-xs text-indigo-300 mt-1">Ready for Analysis</p></div>
                       </div>
                       <div className="flex items-center space-x-3">
                           <button 
                             type="button" 
                             onClick={handleManualSave} 
                             disabled={isSaving}
                             className={`flex items-center space-x-1 px-4 py-2 rounded-lg border transition-all relative group ${
                               isSaving 
                                 ? 'bg-emerald-500/5 text-emerald-400/50 border-emerald-500/10 cursor-wait' 
                                 : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border-emerald-500/20 active:scale-95'
                             }`}
                           >
                             {isSaving ? (
                               <>
                                 <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                 </svg>
                                 <span className="text-xs font-bold">{t.saving}</span>
                               </>
                             ) : (
                               <>
                                 <Save className="w-4 h-4" />
                                 <span className="text-xs font-bold">{t.save}</span>
                               </>
                             )}
                             {showSaveSuccess && (
                               <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded shadow animate-fade-in whitespace-nowrap z-10">
                                 {t.saved}
                               </span>
                             )}
                           </button>
                           <button type="button" onClick={clearFile} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all active:scale-95"><X className="w-5 h-5" /></button>
                       </div>
                     </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.txt,.md" className="hidden" />
              </div>


              <div className="pt-4 border-t border-slate-700/50 mt-auto">
                 {/* 啟動 AI 戰略分析按鈕 */}
                 <button 
                   type="submit" 
                   disabled={isLoading || !jobDescription || !resume || isSaving} 
                   className={`w-full py-5 px-6 rounded-xl font-black text-xl text-white shadow-lg transition-all transform flex justify-center items-center ${
                     isLoading || !jobDescription || !resume || isSaving
                       ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
                       : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/25 ring-1 ring-white/10 shadow-indigo-500/20 active:scale-[0.98] hover:scale-[1.02]'
                   }`}
                 >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="animate-pulse">生成深度戰略報告...</span>
                    </>
                  ) : isSaving ? (
                    <span className="text-slate-500">請等待儲存完成...</span>
                  ) : (
                    <>
                      <span className="mr-2">啟動 AI 戰略分析</span>
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InputForm;
