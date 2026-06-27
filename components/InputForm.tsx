'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { UserInputs, ResumeInput, InterviewReport } from '@/types';
import { FileText, Upload, X, Sparkles, Zap, Globe, AlertTriangle, History, Clock, ArrowRight, Save, MessageSquare, Briefcase, TrendingUp } from 'lucide-react';
import { BeagleIcon } from './AnalysisDashboard';
import { createClient } from '@/lib/supabase/browser';
import { AppLanguage } from '@/lib/language-context';

interface SavedResume extends ResumeInput {
  id: string;
  timestamp: number;
}

interface InputFormProps {
  onSubmit: (inputs: UserInputs) => void;
  isLoading: boolean;
  language?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  initialJobDescription?: string;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, language = 'en', onLanguageChange, initialJobDescription }) => {
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(language);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState<ResumeInput | null>(null);
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [resumeHistory, setResumeHistory] = useState<SavedResume[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResumeHistory();
    
    // 如果有插件傳入的職缺描述，自動填充
    if (initialJobDescription) {
      setJobDescription(initialJobDescription);
    }
  }, [initialJobDescription]);

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
        .limit(3);

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
    console.log('🔵 [saveResumeToHistory] 開始儲存', { type: newResume.type, fileName: newResume.fileName });
    try {
      const supabase = createClient();
      
      // 快速獲取用戶信息（使用緩存的 session）
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      console.log('🔵 [saveResumeToHistory] 用戶檢查', { hasUser: !!user, userError: userError?.message });

      if (userError || !user || !user.id) {
        console.warn('⚠️ [saveResumeToHistory] User not logged in, skipping resume save.');
        alert('請先登入才能儲存履歷');
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

      // 強制最多 3 份：超過時刪除最舊的
      const { data: existing } = await supabase
        .from('resume_history')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (existing && existing.length >= 3) {
        const toDelete = existing.slice(0, existing.length - 2); // keep 2, will add 1 → total 3
        for (const r of toDelete) {
          await supabase.from('resume_history').delete().eq('id', r.id);
        }
      }

      const { error } = await supabase
        .from('resume_history')
        .insert(insertPayload);

      const duration = Date.now() - startTime;
      
      if (error) {
        console.error('❌ [saveResumeToHistory] 儲存履歷失敗:', error);
        console.error('❌ [saveResumeToHistory] 錯誤詳情:', JSON.stringify(error, null, 2));
        alert(`儲存失敗: ${error.message || '未知錯誤'}`);
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
    console.log('🔵 [handleManualSave] 被调用', { hasResume: !!resume, isSaving });
    if (!resume) {
      console.warn('⚠️ 沒有履歷可儲存');
      return;
    }
    if (isSaving) {
      console.warn('⚠️ 正在儲存中，請稍候');
      return;
    }
    console.log('✅ [handleManualSave] 開始儲存履歷');
    setIsSaving(true);
    try {
      await saveResumeToHistory(resume);
    } catch (error) {
      console.error('❌ [handleManualSave] 儲存失敗:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (language !== currentLanguage) {
      setCurrentLanguage(language);
    }
  }, [language]);

  const handleLanguageChange = (lang: AppLanguage) => {
    setCurrentLanguage(lang);
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  const validateJobDescription = (text: string): string | null => {
    const trimmed = text.trim();
    const lang = currentLanguage;

    // URLs are always valid — let the API handle them
    if (/^https?:\/\/[^\s]+$/.test(trimmed)) return null;

    // 1. Minimum length
    if (trimmed.length < 40) {
      return lang === 'zh'
        ? '⚠️ 職缺描述太短，請貼上完整的職缺內容（至少 40 字元）。'
        : '⚠️ Job description is too short. Please paste the complete job posting (at least 40 characters).';
    }

    const noSpace = trimmed.replace(/\s+/g, '');

    // 2. Same character repeating 10+ times in a row (e.g. "aaaaaaaaaa")
    if (/(.)\1{9,}/.test(noSpace)) {
      return lang === 'zh'
        ? '⚠️ 偵測到無效內容（重複字元），請貼上真實的職缺描述。'
        : '⚠️ Invalid content detected (repeating characters). Please paste a real job description.';
    }

    // 3. Meaningful character ratio: letters/CJK chars should be ≥ 15% of total
    //    (lowered from 20% to accommodate LinkedIn/104 formatting with bullets, symbols, whitespace)
    const meaningful = (trimmed.match(/[a-zA-Z\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    if (meaningful / trimmed.length < 0.15) {
      return lang === 'zh'
        ? '⚠️ 職缺描述中幾乎沒有有效文字（主要為符號或數字），請確認是否已貼上正確內容。'
        : '⚠️ Job description contains very little readable text (mostly symbols or numbers). Please check the content.';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateJobDescription(jobDescription);
    if (validationError) {
      setJdError(validationError);
      return;
    }
    setJdError(null);

    if (resume) {
      onSubmit({ jobDescription, resume, language: currentLanguage });
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
    console.log('📁 [File Upload] 文件选择事件触发', { file: file?.name, size: file?.size, type: file?.type });
    
    if (!file) {
      console.warn('⚠️ [File Upload] 没有选择文件');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      console.error('❌ [File Upload] 文件太大:', file.size);
      alert(t.fileTooLarge);
      return;
    }

    console.log('✅ [File Upload] 开始处理文件:', file.name);

    const processFile = (result: string, isPdf: boolean, isWord: boolean) => {
      const mimeType = isPdf ? 'application/pdf' : isWord
        ? (fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword')
        : undefined;
      console.log('✅ [File Upload] 文件处理完成', { fileName: file.name, type: isPdf ? 'PDF' : isWord ? 'Word' : 'Text', contentLength: result.length });
      setResume({
        type: isPdf || isWord ? 'file' : 'text',
        content: result,
        mimeType: mimeType ?? undefined,
        fileName: file.name
      });
    };

    const fileName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');
    const isWord = file.type === 'application/msword' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                   fileName.endsWith('.doc') || fileName.endsWith('.docx');
    
    if (isPdf || isWord) {
      console.log(`📄 [File Upload] 处理 ${isPdf ? 'PDF' : 'Word'} 文件`);
      const reader = new FileReader();
      reader.onerror = (error) => {
        console.error(`❌ [File Upload] ${isPdf ? 'PDF' : 'Word'} 读取错误:`, error);
        alert(`读取 ${isPdf ? 'PDF' : 'Word'} 文件时发生错误，请重试`);
      };
      reader.onloadend = () => {
        const result = reader.result as string;
        if (!result) {
          console.error(`❌ [File Upload] ${isPdf ? 'PDF' : 'Word'} 读取结果为空`);
          alert(`读取 ${isPdf ? 'PDF' : 'Word'} 文件失败，请重试`);
          return;
        }
        const base64String = result.split(',')[1];
        if (!base64String) {
          console.error('❌ [File Upload] Base64 编码失败');
          alert(`${isPdf ? 'PDF' : 'Word'} 文件编码失败，请重试`);
          return;
        }
        processFile(base64String, isPdf, isWord);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('📝 [File Upload] 处理文本文件');
      const reader = new FileReader();
      reader.onerror = (error) => {
        console.error('❌ [File Upload] 文本文件读取错误:', error);
        alert('读取文本文件时发生错误，请重试');
      };
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
          console.error('❌ [File Upload] 文本读取结果为空');
          alert('读取文本文件失败，请重试');
          return;
        }
        processFile(text, false, false);
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

  type TKeys = { title: string; subtitle: string; description: string; jobDescription: string; upload: string; save: string; saving: string; saved: string; saveFailed: string; generate: string; resumeLibrary: string; recentReports: string; noResume: string; recentlyUploaded: string; engineIntro: string; engineDescription: string; reportOutput: string; matchAnalysis: string; matchAnalysisDesc: string; salaryResearch: string; salaryResearchDesc: string; industryAnalysis: string; industryAnalysisDesc: string; interviewPrep: string; interviewPrepDesc: string; jobData: string; jdFullTextHint: string; inputJobUrl: string; jobUrlPlaceholder: string; urlTip: string; resume: string; uploadSupport: string; waitingSave: string; generating: string; fileTooLarge: string };
  const translations: Record<AppLanguage, TKeys> = {
    zh: {
      title: 'Jobbeagle',
      subtitle: '職位分析米格魯',
      description: '專家級 AI 職缺戰略分析中心：結合求職專家分析與獵頭視角，助您掌握應對策略。',
      jobDescription: '職缺描述 (JD)',
      upload: '點擊上傳 PDF 或文字檔',
      save: '儲存', saving: '儲存中...', saved: '✓ 已儲存!', saveFailed: '儲存失敗，請重試',
      generate: '啟動AI戰略分析',
      resumeLibrary: '履歷庫', recentReports: '近期分析報告', noResume: '尚未儲存任何履歷', recentlyUploaded: '最近上傳的履歷',
      engineIntro: '戰略引擎簡介',
      engineDescription: 'Jobbeagle 搭載頂級人資與求職專家分析邏輯，深度解析 JD 背後的組織需求與市場格局。不只評估匹配度，更為您提供具備商業深度的薪資情報與攻防建議。',
      reportOutput: '深度報告產出項',
      matchAnalysis: '人才職位匹配分析', matchAnalysisDesc: '揭示職位隱藏門檻，精準評估您的核心優勢與缺口。',
      salaryResearch: '真實面試題與薪酬範圍', salaryResearchDesc: '提供真實面試考古題、市場薪酬範圍及談判策略。',
      industryAnalysis: '產業格局與競爭者分析', industryAnalysisDesc: '從求職專家視角解析公司的市場護城河與未來風險。',
      interviewPrep: '高階面試模擬與對策', interviewPrepDesc: '網羅真實考題並提供具備深度邏輯的 STAR 回答引導。',
      jobData: '1. 職缺資訊 (Job Data)',
      jdFullTextHint: '請在職缺頁手動複製「完整」職缺內容後貼上；勿只貼網址或片段。',
      inputJobUrl: '職缺內容', jobUrlPlaceholder: '手動複製該頁完整職缺內容並貼上（勿只貼連結）…',
      urlTip: '偵測到網址：請改為到職缺頁手動複製完整內容後貼上。',
      resume: '2. 您的履歷 (Resume)', uploadSupport: '支援 .pdf, .doc, .docx, .txt, .md (Max 4MB)',
      waitingSave: '請等待儲存完成...', generating: '生成深度戰略報告...', fileTooLarge: '檔案大小超過 4MB，請上傳較小的檔案。',
    },
    en: {
      title: 'Jobbeagle', subtitle: '(Job Analysis Beagle)',
      description: 'Expert-level AI Job Strategy Analysis Center: Combining career expert analysis with headhunter perspective to help you master response strategies.',
      jobDescription: 'Job Description (JD)',
      upload: 'Click to upload PDF or text file',
      save: 'Save', saving: 'Saving...', saved: '✓ Saved!', saveFailed: 'Save failed, please try again',
      generate: 'Launch AI Strategy Analysis',
      resumeLibrary: 'Resume Library', recentReports: 'Recent Analysis Reports', noResume: 'No resumes saved yet', recentlyUploaded: 'Recently uploaded resumes',
      engineIntro: 'Strategic Engine Introduction',
      engineDescription: 'Jobbeagle is equipped with top-tier HR and career expert analysis logic, deeply analyzing organizational needs and market dynamics behind JDs. Not only evaluating match, but also providing business-depth salary intelligence and strategic advice.',
      reportOutput: 'In-Depth Report Outputs',
      matchAnalysis: 'Talent-Position Match Analysis', matchAnalysisDesc: 'Reveal hidden job thresholds and accurately assess your core strengths and gaps.',
      salaryResearch: 'Real Interview Questions & Salary Range', salaryResearchDesc: 'Provide real interview questions, market salary ranges, and negotiation strategies.',
      industryAnalysis: 'Industry Landscape & Competitor Analysis', industryAnalysisDesc: 'Analyze company market moats and future risks from a career expert perspective.',
      interviewPrep: 'Advanced Interview Simulation & Strategy', interviewPrepDesc: 'Gather real interview questions and provide in-depth STAR answer guidance.',
      jobData: '1. Job Information (Job Data)',
      jdFullTextHint: 'Manually copy the full job posting from the page, then paste here. Do not paste only a URL or a short excerpt.',
      inputJobUrl: 'Job posting', jobUrlPlaceholder: 'Copy the full job description from the page and paste here (not the link alone)…',
      urlTip: 'URL detected: open the posting and paste the full copied text instead.',
      resume: '2. Your Resume', uploadSupport: 'Supports .pdf, .doc, .docx, .txt, .md (Max 4MB)',
      waitingSave: 'Please wait for save to complete...', generating: 'Generating in-depth strategic report...', fileTooLarge: 'File size exceeds 4MB, please upload a smaller file.',
    },
    ja: {
      title: 'Jobbeagle', subtitle: '(求人分析ビーグル)',
      description: 'AIによる求人戦略分析センター：キャリア専門家とヘッドハンターの視点を組み合わせ、最適な対応戦略をサポートします。',
      jobDescription: '求人票 (JD)',
      upload: 'PDFまたはテキストファイルをアップロード',
      save: '保存', saving: '保存中...', saved: '✓ 保存済み!', saveFailed: '保存に失敗しました。再試行してください',
      generate: 'AI戦略分析を開始',
      resumeLibrary: '履歴書ライブラリ', recentReports: '最近の分析レポート', noResume: '保存された履歴書はありません', recentlyUploaded: '最近アップロードした履歴書',
      engineIntro: '戦略エンジンのご紹介',
      engineDescription: 'Jobbeagleは一流の人事・求職専門家の分析ロジックを搭載し、JDの背後にある組織ニーズと市場動向を深く分析します。マッチングの評価だけでなく、ビジネス視点の給与情報と戦略的アドバイスを提供します。',
      reportOutput: '詳細レポートの内容',
      matchAnalysis: '人材・職位マッチング分析', matchAnalysisDesc: '職位の隠れた要件を明らかにし、あなたの強みと課題を正確に評価します。',
      salaryResearch: '実際の面接質問・給与範囲', salaryResearchDesc: '実際の面接質問、市場の給与範囲、交渉戦略を提供します。',
      industryAnalysis: '業界動向・競合分析', industryAnalysisDesc: 'キャリア専門家の視点から企業の市場優位性と将来のリスクを分析します。',
      interviewPrep: '高度な面接シミュレーション', interviewPrepDesc: '実際の面接問題を収集し、深みのあるSTAR回答ガイダンスを提供します。',
      jobData: '1. 求人情報 (Job Data)',
      jdFullTextHint: '求人ページから「完全な」求人内容を手動でコピーして貼り付けてください。URLや一部だけの貼り付けはお避けください。',
      inputJobUrl: '求人内容', jobUrlPlaceholder: 'ページから求人の全文をコピーして貼り付けてください（リンクのみは不可）…',
      urlTip: 'URLを検出：求人ページを開いて全文をコピーして貼り付けてください。',
      resume: '2. あなたの履歴書', uploadSupport: '.pdf, .doc, .docx, .txt, .md に対応（最大4MB）',
      waitingSave: '保存が完了するまでお待ちください...', generating: '詳細な戦略レポートを生成中...', fileTooLarge: 'ファイルサイズが4MBを超えています。小さいファイルをアップロードしてください。',
    },
    ko: {
      title: 'Jobbeagle', subtitle: '(채용 분석 비글)',
      description: 'AI 채용 전략 분석 센터: 커리어 전문가와 헤드헌터 관점을 결합하여 최적의 대응 전략을 지원합니다.',
      jobDescription: '채용 공고 (JD)',
      upload: 'PDF 또는 텍스트 파일 업로드',
      save: '저장', saving: '저장 중...', saved: '✓ 저장됨!', saveFailed: '저장 실패, 다시 시도해주세요',
      generate: 'AI 전략 분석 시작',
      resumeLibrary: '이력서 라이브러리', recentReports: '최근 분석 보고서', noResume: '저장된 이력서가 없습니다', recentlyUploaded: '최근 업로드한 이력서',
      engineIntro: '전략 엔진 소개',
      engineDescription: 'Jobbeagle은 최고 수준의 HR·커리어 전문가 분석 로직을 탑재하여 JD 뒤에 숨겨진 조직 요구와 시장 동향을 깊이 분석합니다. 매칭 평가뿐 아니라 비즈니스 깊이의 연봉 정보와 전략적 조언을 제공합니다.',
      reportOutput: '심층 보고서 항목',
      matchAnalysis: '인재-직위 매칭 분석', matchAnalysisDesc: '직위의 숨겨진 요건을 밝히고 핵심 강점과 격차를 정확히 평가합니다.',
      salaryResearch: '실제 면접 질문 및 연봉 범위', salaryResearchDesc: '실제 면접 질문, 시장 연봉 범위 및 협상 전략을 제공합니다.',
      industryAnalysis: '산업 동향 및 경쟁사 분석', industryAnalysisDesc: '커리어 전문가 관점에서 기업의 시장 해자와 미래 위험을 분석합니다.',
      interviewPrep: '고급 면접 시뮬레이션 및 전략', interviewPrepDesc: '실제 면접 문제를 수집하고 심층 STAR 답변 가이드를 제공합니다.',
      jobData: '1. 채용 정보 (Job Data)',
      jdFullTextHint: '채용 페이지에서 「전체」채용 내용을 수동으로 복사하여 붙여넣으세요. URL이나 일부만 붙여넣지 마세요.',
      inputJobUrl: '채용 내용', jobUrlPlaceholder: '채용 페이지의 전체 내용을 복사하여 붙여넣으세요 (링크만 불가)…',
      urlTip: 'URL 감지됨: 채용 페이지를 열어 전체 내용을 복사하여 붙여넣으세요.',
      resume: '2. 귀하의 이력서', uploadSupport: '.pdf, .doc, .docx, .txt, .md 지원 (최대 4MB)',
      waitingSave: '저장이 완료될 때까지 기다려주세요...', generating: '심층 전략 보고서 생성 중...', fileTooLarge: '파일 크기가 4MB를 초과합니다. 더 작은 파일을 업로드해주세요.',
    },
    id: {
      title: 'Jobbeagle', subtitle: '(Beagle Analisis Pekerjaan)',
      description: 'Pusat Analisis Strategi Pekerjaan AI: Menggabungkan analisis ahli karier dan perspektif headhunter untuk membantu Anda menguasai strategi respons.',
      jobDescription: 'Deskripsi Pekerjaan (JD)',
      upload: 'Klik untuk unggah PDF atau file teks',
      save: 'Simpan', saving: 'Menyimpan...', saved: '✓ Tersimpan!', saveFailed: 'Gagal menyimpan, coba lagi',
      generate: 'Mulai Analisis Strategi AI',
      resumeLibrary: 'Perpustakaan Resume', recentReports: 'Laporan Analisis Terbaru', noResume: 'Belum ada resume tersimpan', recentlyUploaded: 'Resume yang baru diunggah',
      engineIntro: 'Pengenalan Mesin Strategis',
      engineDescription: 'Jobbeagle dilengkapi dengan logika analisis HR dan ahli karier kelas atas, menganalisis kebutuhan organisasi dan dinamika pasar di balik JD secara mendalam.',
      reportOutput: 'Output Laporan Mendalam',
      matchAnalysis: 'Analisis Kecocokan Kandidat-Posisi', matchAnalysisDesc: 'Mengungkap ambang tersembunyi posisi dan menilai kekuatan serta kesenjangan Anda secara akurat.',
      salaryResearch: 'Pertanyaan Wawancara & Rentang Gaji', salaryResearchDesc: 'Menyediakan pertanyaan wawancara nyata, rentang gaji pasar, dan strategi negosiasi.',
      industryAnalysis: 'Lanskap Industri & Analisis Pesaing', industryAnalysisDesc: 'Menganalisis keunggulan pasar dan risiko masa depan perusahaan dari perspektif ahli karier.',
      interviewPrep: 'Simulasi Wawancara Tingkat Lanjut', interviewPrepDesc: 'Mengumpulkan pertanyaan wawancara nyata dan memberikan panduan jawaban STAR yang mendalam.',
      jobData: '1. Informasi Lowongan (Job Data)',
      jdFullTextHint: 'Salin secara manual seluruh konten lowongan dari halaman, lalu tempel di sini. Jangan hanya menempel URL atau kutipan singkat.',
      inputJobUrl: 'Konten lowongan', jobUrlPlaceholder: 'Salin deskripsi pekerjaan lengkap dari halaman dan tempel di sini (bukan hanya tautan)…',
      urlTip: 'URL terdeteksi: buka halaman lowongan dan tempel teks lengkap yang disalin.',
      resume: '2. Resume Anda', uploadSupport: 'Mendukung .pdf, .doc, .docx, .txt, .md (Maks 4MB)',
      waitingSave: 'Harap tunggu hingga penyimpanan selesai...', generating: 'Membuat laporan strategi mendalam...', fileTooLarge: 'Ukuran file melebihi 4MB, unggah file yang lebih kecil.',
    },
    vi: {
      title: 'Jobbeagle', subtitle: '(Beagle Phân tích Việc làm)',
      description: 'Trung tâm Phân tích Chiến lược Việc làm AI: Kết hợp phân tích chuyên gia nghề nghiệp và góc nhìn headhunter để giúp bạn nắm vững chiến lược phản hồi.',
      jobDescription: 'Mô tả Công việc (JD)',
      upload: 'Nhấp để tải lên PDF hoặc tệp văn bản',
      save: 'Lưu', saving: 'Đang lưu...', saved: '✓ Đã lưu!', saveFailed: 'Lưu thất bại, vui lòng thử lại',
      generate: 'Bắt đầu Phân tích Chiến lược AI',
      resumeLibrary: 'Thư viện CV', recentReports: 'Báo cáo Phân tích Gần đây', noResume: 'Chưa có CV nào được lưu', recentlyUploaded: 'CV vừa tải lên',
      engineIntro: 'Giới thiệu Công cụ Chiến lược',
      engineDescription: 'Jobbeagle được trang bị logic phân tích HR và chuyên gia nghề nghiệp hàng đầu, phân tích sâu nhu cầu tổ chức và động lực thị trường đằng sau JD.',
      reportOutput: 'Nội dung Báo cáo Chuyên sâu',
      matchAnalysis: 'Phân tích Phù hợp Nhân tài-Vị trí', matchAnalysisDesc: 'Tiết lộ ngưỡng ẩn của vị trí và đánh giá chính xác điểm mạnh và điểm thiếu của bạn.',
      salaryResearch: 'Câu hỏi Phỏng vấn Thực tế & Mức lương', salaryResearchDesc: 'Cung cấp câu hỏi phỏng vấn thực tế, mức lương thị trường và chiến lược đàm phán.',
      industryAnalysis: 'Bức tranh Ngành & Phân tích Đối thủ', industryAnalysisDesc: 'Phân tích lợi thế thị trường và rủi ro tương lai của công ty từ góc độ chuyên gia nghề nghiệp.',
      interviewPrep: 'Mô phỏng Phỏng vấn Nâng cao', interviewPrepDesc: 'Thu thập câu hỏi phỏng vấn thực và cung cấp hướng dẫn trả lời STAR chuyên sâu.',
      jobData: '1. Thông tin Tuyển dụng (Job Data)',
      jdFullTextHint: 'Sao chép thủ công toàn bộ nội dung tuyển dụng từ trang, sau đó dán vào đây. Không chỉ dán URL hoặc đoạn trích ngắn.',
      inputJobUrl: 'Nội dung tuyển dụng', jobUrlPlaceholder: 'Sao chép mô tả công việc đầy đủ từ trang và dán vào đây (không chỉ liên kết)…',
      urlTip: 'Phát hiện URL: mở trang tuyển dụng và dán toàn bộ văn bản đã sao chép.',
      resume: '2. CV của bạn', uploadSupport: 'Hỗ trợ .pdf, .doc, .docx, .txt, .md (Tối đa 4MB)',
      waitingSave: 'Vui lòng chờ lưu hoàn tất...', generating: 'Đang tạo báo cáo chiến lược chuyên sâu...', fileTooLarge: 'Kích thước tệp vượt quá 4MB, vui lòng tải lên tệp nhỏ hơn.',
    },
  };

  const t = translations[currentLanguage];

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center space-y-3 py-4">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight flex flex-col md:flex-row items-center justify-center hover:opacity-80 transition-opacity cursor-pointer">
            <div className="flex items-center">
              <div className="mr-6">
                 <BeagleIcon className="w-16 h-16 md:w-28 md:h-28 drop-shadow-xl" color="#cbd5e1" spotColor="#5d4037" bellyColor="#94a3b8" />
              </div>
              <span><span className="text-white">Job</span><span className="text-blue-600 dark:text-blue-500">beagle</span></span>
            </div>
            <span className="text-sm md:text-lg font-medium text-slate-500 mt-2 md:mt-0 md:ml-6 tracking-normal">
              {t.subtitle}
            </span>
          </h1>
        </Link>
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
                  {t.engineIntro}
               </h2>
               <p className="text-slate-300 text-lg leading-8 mb-6 bg-slate-700/30 p-5 rounded-xl border border-slate-600/30 font-medium">
                  {t.engineDescription}
               </p>
           </div>

           <div className="px-8">
              <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
           </div>

           <div className="p-8 pt-6 flex-1 flex flex-col">
               <h2 className="text-2xl font-bold text-white flex items-center mb-6">
                  <span className="w-1.5 h-8 bg-emerald-500 rounded-full mr-4"></span>
                  {t.reportOutput}
               </h2>
               
               <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-start p-4 rounded-xl hover:bg-slate-700/30 transition-colors">
                     <div className="bg-yellow-500/20 p-2.5 rounded-lg mr-4 shrink-0 mt-1">
                        <Zap className="w-6 h-6 text-yellow-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-bold text-slate-200 mb-1">{t.matchAnalysis}</span>
                       <span className="text-sm text-slate-400 leading-normal">{t.matchAnalysisDesc}</span>
                     </div>
                  </div>
                  
                  <div className="flex items-start p-4 rounded-xl hover:bg-slate-700/30 transition-colors">
                     <div className="bg-emerald-500/20 p-2.5 rounded-lg mr-4 shrink-0 mt-1">
                        <Briefcase className="w-6 h-6 text-emerald-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-bold text-slate-200 mb-1">{t.salaryResearch}</span>
                       <span className="text-sm text-slate-400 leading-normal">{t.salaryResearchDesc}</span>
                     </div>
                  </div>

                  <div className="flex items-start p-4 rounded-xl hover:bg-slate-700/30 transition-colors">
                     <div className="bg-sky-500/20 p-2.5 rounded-lg mr-4 shrink-0 mt-1">
                        <TrendingUp className="w-6 h-6 text-sky-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-bold text-slate-200 mb-1">{t.industryAnalysis}</span>
                       <span className="text-sm text-slate-400 leading-normal">{t.industryAnalysisDesc}</span>
                     </div>
                  </div>

                  <div className="flex items-start p-4 rounded-xl hover:bg-slate-700/30 transition-colors">
                     <div className="bg-indigo-500/20 p-2.5 rounded-lg mr-4 shrink-0 mt-1">
                        <MessageSquare className="w-6 h-6 text-indigo-400" />
                     </div>
                     <div className="flex flex-col">
                       <span className="text-lg font-bold text-slate-200 mb-1">{t.interviewPrep}</span>
                       <span className="text-sm text-slate-400 leading-normal">{t.interviewPrepDesc}</span>
                     </div>
                  </div>
               </div>
           </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full relative">
          <div className="p-6 pb-4">
              <h2 className="text-2xl font-bold text-white flex items-center mb-5">
                <span className="w-1.5 h-8 bg-indigo-500 rounded-full mr-4"></span>
                {t.jobData}
              </h2>
              <label className="block text-base font-medium text-slate-300 mb-3 flex items-center justify-between">
                  <div className="flex items-center">
                  {inputType === 'url' ? (
                      <Globe className="w-5 h-5 mr-2 text-blue-400 animate-pulse" />
                  ) : (
                      <FileText className="w-5 h-5 mr-2 text-indigo-400" />
                  )}
                  {t.inputJobUrl}
                  </div>
              </label>
              <p className="mb-3 text-sm text-amber-200/90 leading-relaxed bg-amber-950/40 border border-amber-600/40 rounded-lg px-3 py-2.5">
                {t.jdFullTextHint}
              </p>
              <div className="relative">
                  <textarea
                  required
                  className={`w-full min-h-[180px] bg-slate-900 border rounded-xl p-5 text-base text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y ${
                      inputType === 'url' ? 'border-blue-500/50 text-blue-100' : 'border-slate-700'
                  }`}
                  placeholder={t.jobUrlPlaceholder}
                  value={jobDescription}
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (jdError) setJdError(null);
                  }}
                  />
                  {inputType === 'url' && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-start p-2 bg-blue-900/40 rounded border border-blue-500/30 text-sm text-blue-200 backdrop-blur-sm">
                      <AlertTriangle className="w-4 h-4 mr-2 shrink-0 text-blue-400 mt-0.5" />
                      <span>{t.urlTip}</span>
                  </div>
                  )}
              </div>
              {jdError && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-sm text-red-300 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{jdError}</span>
                </div>
              )}
          </div>

          <div className="px-6">
             <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2" />
          </div>

          <div className="p-6 pt-4 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <span className="w-1.5 h-8 bg-violet-500 rounded-full mr-4"></span>
                  {t.resume}
                </h2>
                {/* 履歷庫按鈕 */}
                <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                        className="flex items-center space-x-2 text-sm text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-2.5 rounded-full border border-indigo-500/20 transition-all active:scale-95 hover:scale-105 whitespace-nowrap"
                      >
                        <History className="w-4 h-4" />
                        <span className="font-bold">{t.resumeLibrary} {resumeHistory.length > 0 && `(${resumeHistory.length})`}</span>
                      </button>
                    {showHistoryDropdown && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowHistoryDropdown(false)} />
                        <div className="absolute right-0 top-10 w-80 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-20 animate-fade-in overflow-hidden">
                        <div className="p-3 bg-slate-900/80 border-b border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {t.recentlyUploaded}
                        </div>
                        {resumeHistory.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">
                                <p>{t.noResume}</p>
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
                    <div className="w-full h-full min-h-[180px] border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center bg-slate-900/30 transition-all relative">
                        <label 
                          htmlFor="resume-file-input"
                          className="flex flex-col items-center justify-center cursor-pointer hover:bg-slate-700/30 w-full p-6 flex-1 rounded-t-xl group relative z-10"
                        >
                            <div className="p-4 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 transition-colors mb-3 border border-slate-700 group-hover:border-indigo-500/30">
                                <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" />
                            </div>
                            <p className="text-base text-slate-300 font-bold">{t.upload}</p>
                            <p className="text-xs text-slate-500 mt-1 font-medium">{t.uploadSupport}</p>
                        </label>
                        <input 
                          id="resume-file-input"
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileChange} 
                          accept=".pdf,.doc,.docx,.txt,.md" 
                          className="hidden" 
                          aria-label="Upload resume file"
                        />
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
              </div>


              <div className="pt-4 border-t border-slate-700/50 mt-auto">
                 {/* 啟動 AI 戰略分析按鈕 */}
                 <button 
                   type="submit" 
                   disabled={isLoading || !jobDescription || !resume || isSaving} 
                   className={`w-full py-5 px-6 rounded-xl font-black text-xl text-white shadow-lg transition-all transform flex justify-center items-center ${
                     isLoading || !jobDescription || !resume || isSaving
                       ? 'bg-slate-700 cursor-not-allowed text-slate-500'
                       : jdError
                         ? 'bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 ring-1 ring-red-500/30 active:scale-[0.98]'
                         : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/25 ring-1 ring-white/10 shadow-indigo-500/20 active:scale-[0.98] hover:scale-[1.02]'
                   }`}
                 >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="animate-pulse">{t.generating}</span>
                    </>
                  ) : isSaving ? (
                    <span className="text-slate-500">{t.waitingSave}</span>
                  ) : (
                    <>
                      <span className="mr-2">{t.generate}</span>
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
