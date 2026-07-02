'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { UserInputs, ResumeInput, InterviewReport } from '@/types';
import { FileText, Upload, X, AlertTriangle, History, Clock, ArrowRight, Globe } from 'lucide-react';
import { BeagleIcon } from './report/report-shared';
import { Panel, Button, SectionLabel } from '@/components/ui/primitives';
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
      return lang === 'zh-TW' || lang === 'zh-CN'
        ? '⚠️ 職缺描述太短，請貼上完整的職缺內容（至少 40 字元）。'
        : '⚠️ Job description is too short. Please paste the complete job posting (at least 40 characters).';
    }

    const noSpace = trimmed.replace(/\s+/g, '');

    // 2. Same character repeating 10+ times in a row (e.g. "aaaaaaaaaa")
    if (/(.)\1{9,}/.test(noSpace)) {
      return lang === 'zh-TW' || lang === 'zh-CN'
        ? '⚠️ 偵測到無效內容（重複字元），請貼上真實的職缺描述。'
        : '⚠️ Invalid content detected (repeating characters). Please paste a real job description.';
    }

    // 3. Meaningful character ratio: letters/CJK chars should be ≥ 15% of total
    //    (lowered from 20% to accommodate LinkedIn/104 formatting with bullets, symbols, whitespace)
    const meaningful = (trimmed.match(/[a-zA-Z\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
    if (meaningful / trimmed.length < 0.15) {
      return lang === 'zh-TW' || lang === 'zh-CN'
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

  type TKeys = { tagline: string; chips: [string, string, string]; jobDescription: string; upload: string; save: string; saving: string; saved: string; generate: string; resumeLibrary: string; noResume: string; recentlyUploaded: string; jobData: string; jdFullTextHint: string; inputJobUrl: string; jobUrlPlaceholder: string; urlTip: string; resume: string; uploadSupport: string; waitingSave: string; generating: string; fileTooLarge: string };
  const translations: Record<AppLanguage, TKeys> = {
    'zh-TW': { tagline: 'AI 職缺戰略分析', chips: ['匹配', '薪資', '面試'], jobDescription: '職缺描述', upload: '上傳 PDF 或文字檔', save: '儲存', saving: '儲存中...', saved: '✓ 已儲存', generate: '開始分析', resumeLibrary: '履歷庫', noResume: '尚無儲存履歷', recentlyUploaded: '最近上傳', jobData: '職缺資訊', jdFullTextHint: '請貼上完整職缺內容，勿只貼網址。', inputJobUrl: '職缺內容', jobUrlPlaceholder: '複製完整職缺內容並貼上…', urlTip: '偵測到網址：請改貼完整職缺文字。', resume: '您的履歷', uploadSupport: '.pdf · .doc · .docx · .txt · .md（最大 4MB）', waitingSave: '請等待儲存完成…', generating: '分析中…', fileTooLarge: '檔案超過 4MB，請上傳較小檔案。' },
    'zh-CN': { tagline: 'AI 职位战略分析', chips: ['匹配', '薪资', '面试'], jobDescription: '职位描述', upload: '上传 PDF 或文本', save: '保存', saving: '保存中...', saved: '✓ 已保存', generate: '开始分析', resumeLibrary: '简历库', noResume: '暂无保存简历', recentlyUploaded: '最近上传', jobData: '职位信息', jdFullTextHint: '请贴上完整职位内容，勿只贴网址。', inputJobUrl: '职位内容', jobUrlPlaceholder: '复制完整职位内容并贴上…', urlTip: '检测到网址：请改贴完整职位文字。', resume: '您的简历', uploadSupport: '.pdf · .doc · .docx · .txt · .md（最大 4MB）', waitingSave: '请等待保存完成…', generating: '分析中…', fileTooLarge: '文件超过 4MB，请上传较小文件。' },
    en: { tagline: 'AI job strategy analysis', chips: ['Match', 'Salary', 'Interview'], jobDescription: 'Job description', upload: 'Upload PDF or text file', save: 'Save', saving: 'Saving...', saved: '✓ Saved', generate: 'Analyze', resumeLibrary: 'Resume library', noResume: 'No saved resumes', recentlyUploaded: 'Recent uploads', jobData: 'Job posting', jdFullTextHint: 'Paste the full job posting, not just a URL.', inputJobUrl: 'Job content', jobUrlPlaceholder: 'Paste the full job description…', urlTip: 'URL detected: paste the full copied text instead.', resume: 'Your resume', uploadSupport: '.pdf · .doc · .docx · .txt · .md (max 4MB)', waitingSave: 'Waiting for save…', generating: 'Analyzing…', fileTooLarge: 'File exceeds 4MB.' },
    es: { tagline: 'Análisis estratégico con IA', chips: ['Match', 'Salario', 'Entrevista'], jobDescription: 'Descripción', upload: 'Subir PDF o texto', save: 'Guardar', saving: 'Guardando...', saved: '✓ Guardado', generate: 'Analizar', resumeLibrary: 'Biblioteca', noResume: 'Sin CV guardados', recentlyUploaded: 'Recientes', jobData: 'Oferta', jdFullTextHint: 'Pega el contenido completo, no solo el enlace.', inputJobUrl: 'Contenido', jobUrlPlaceholder: 'Pega la descripción completa…', urlTip: 'URL detectada: pega el texto completo.', resume: 'Tu CV', uploadSupport: '.pdf · .doc · .docx · .txt · .md (máx 4MB)', waitingSave: 'Esperando guardado…', generating: 'Analizando…', fileTooLarge: 'Archivo mayor a 4MB.' },
    hi: { tagline: 'AI नौकरी रणनीति विश्लेषण', chips: ['मिलान', 'वेतन', 'साक्षात्कार'], jobDescription: 'नौकरी विवरण', upload: 'PDF या टेक्स्ट अपलोड', save: 'सहेजें', saving: 'सहेजा जा रहा…', saved: '✓ सहेजा', generate: 'विश्लेषण', resumeLibrary: 'लाइब्रेरी', noResume: 'कोई CV नहीं', recentlyUploaded: 'हाल के', jobData: 'नौकरी', jdFullTextHint: 'पूरा विवरण पेस्ट करें, केवल URL नहीं।', inputJobUrl: 'सामग्री', jobUrlPlaceholder: 'पूरा विवरण पेस्ट करें…', urlTip: 'URL मिला: पूरा टेक्स्ट पेस्ट करें।', resume: 'आपका CV', uploadSupport: '.pdf · .doc · .docx · .txt · .md (4MB)', waitingSave: 'सहेजने की प्रतीक्षा…', generating: 'विश्लेषण…', fileTooLarge: 'फ़ाइल 4MB से बड़ी है।' },
    ar: { tagline: 'تحليل استراتيجي بالذكاء الاصطناعي', chips: ['التوافق', 'الراتب', 'المقابلة'], jobDescription: 'وصف الوظيفة', upload: 'رفع PDF أو نص', save: 'حفظ', saving: 'جارٍ الحفظ…', saved: '✓ تم', generate: 'تحليل', resumeLibrary: 'المكتبة', noResume: 'لا سير ذاتية', recentlyUploaded: 'الأخيرة', jobData: 'الإعلان', jdFullTextHint: 'الصق الوصف الكامل، وليس الرابط فقط.', inputJobUrl: 'المحتوى', jobUrlPlaceholder: 'الصق وصف الوظيفة الكامل…', urlTip: 'تم اكتشاف رابط: الصق النص الكامل.', resume: 'سيرتك الذاتية', uploadSupport: '.pdf · .doc · .docx · .txt · .md (4MB)', waitingSave: 'انتظر اكتمال الحفظ…', generating: 'جارٍ التحليل…', fileTooLarge: 'الملف أكبر من 4MB.' },
  };


  const t = translations[currentLanguage];

  return (
    <div className="flex flex-col gap-10">
      <div className="space-y-5 py-2 text-center">
        <Link href="/" className="inline-flex flex-col items-center">
          <BeagleIcon className="mb-4 h-14 w-14 md:h-16 md:w-16" color="#002FA7" spotColor="#5d4037" bellyColor="#94a3b8" />
          <h1 className="font-display text-4xl font-semibold tracking-tight text-jb-ink md:text-5xl">
            Job<span className="text-jb-accent">beagle</span>
          </h1>
          <p className="mt-2 text-sm text-jb-ink-muted md:text-base">{t.tagline}</p>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {t.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-jb-border bg-jb-elevated px-4 py-1.5 text-xs font-medium text-jb-ink-muted shadow-jb"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <SectionLabel>{t.jobData}</SectionLabel>
          <label className="mt-3 mb-2 flex items-center text-sm font-medium text-jb-ink">
            {inputType === 'url' ? (
              <Globe className="mr-2 h-4 w-4 animate-pulse text-jb-accent" />
            ) : (
              <FileText className="mr-2 h-4 w-4 text-jb-accent" />
            )}
            {t.inputJobUrl}
          </label>
          <p className="mb-3 rounded-jb border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            {t.jdFullTextHint}
          </p>
          <div className="relative">
            <textarea
              required
              className={`w-full min-h-[200px] resize-y rounded-jb border bg-jb-elevated p-4 text-sm text-jb-ink placeholder-jb-ink-subtle transition-all focus:border-jb-accent/40 focus:outline-none focus:ring-2 focus:ring-jb-accent/15 ${
                inputType === 'url' ? 'border-jb-accent/40' : 'border-jb-border'
              }`}
              placeholder={t.jobUrlPlaceholder}
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (jdError) setJdError(null);
              }}
            />
            {inputType === 'url' && (
              <div className="absolute bottom-3 left-3 right-3 flex items-start rounded-jb border border-jb-accent/20 bg-jb-accent-soft p-2 text-xs text-jb-accent">
                <AlertTriangle className="mr-2 mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{t.urlTip}</span>
              </div>
            )}
          </div>
          {jdError && (
            <div className="mt-3 flex items-start gap-2 rounded-jb border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{jdError}</span>
            </div>
          )}
        </Panel>

        <Panel className="flex flex-col">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <SectionLabel>{t.resume}</SectionLabel>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                className="jb-interactive flex items-center gap-1.5 rounded-full border border-jb-border bg-jb-surface px-3 py-1.5 text-xs font-semibold text-jb-accent"
              >
                <History className="h-3.5 w-3.5" />
                {t.resumeLibrary}{resumeHistory.length > 0 ? ` (${resumeHistory.length})` : ''}
              </button>
              {showHistoryDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowHistoryDropdown(false)} />
                  <div className="absolute right-0 top-9 z-20 w-72 overflow-hidden rounded-jb-lg border border-jb-border bg-jb-elevated shadow-jb-hover animate-fade-in">
                    <div className="border-b border-jb-border px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-jb-ink-subtle">
                      {t.recentlyUploaded}
                    </div>
                    {resumeHistory.length === 0 ? (
                      <div className="p-5 text-center text-sm text-jb-ink-muted">{t.noResume}</div>
                    ) : (
                      resumeHistory.map((historyItem) => (
                        <div
                          key={historyItem.id}
                          onClick={() => handleSelectResume(historyItem)}
                          className="group relative flex cursor-pointer items-start border-b border-jb-border p-3 last:border-0 hover:bg-jb-surface"
                        >
                          <FileText className="mr-2 mt-0.5 h-4 w-4 shrink-0 text-jb-accent" />
                          <div className="min-w-0 flex-1 text-left">
                            <p className="truncate text-sm font-medium text-jb-ink">{historyItem.fileName}</p>
                            <p className="mt-0.5 flex items-center text-[10px] text-jb-ink-subtle">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatDateTime(historyItem.timestamp)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteResume(e, historyItem.id)}
                            className="rounded p-1 text-jb-ink-subtle hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
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
              <label
                htmlFor="resume-file-input"
                className="jb-interactive flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-jb-lg border-2 border-dashed border-jb-border bg-jb-surface/50 p-6 hover:border-jb-accent/30 hover:bg-jb-accent-soft/30"
              >
                <div className="mb-3 rounded-full border border-jb-border bg-jb-elevated p-3">
                  <Upload className="h-7 w-7 text-jb-ink-muted" />
                </div>
                <p className="text-sm font-semibold text-jb-ink">{t.upload}</p>
                <p className="mt-1 text-xs text-jb-ink-subtle">{t.uploadSupport}</p>
                <input
                  id="resume-file-input"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.md"
                  className="hidden"
                  aria-label="Upload resume file"
                />
              </label>
            ) : (
              <div className="flex animate-fade-in items-center justify-between rounded-jb-lg border border-jb-accent/25 bg-jb-accent-soft/40 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-jb bg-jb-accent p-2.5">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-semibold text-jb-ink">{resume.fileName}</p>
                    <p className="text-xs text-jb-accent">Ready</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualSave}
                    disabled={isSaving}
                    className="jb-interactive rounded-jb border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                  >
                    {isSaving ? t.saving : t.save}
                  </button>
                  {showSaveSuccess && (
                    <span className="text-xs font-medium text-emerald-600">{t.saved}</span>
                  )}
                  <button type="button" onClick={clearFile} className="rounded-full p-1.5 text-jb-ink-muted hover:bg-jb-surface hover:text-jb-ink">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !jobDescription || !resume || isSaving}
            className="w-full"
          >
            {isLoading ? (
              <>
                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t.generating}
              </>
            ) : isSaving ? (
              t.waitingSave
            ) : (
              <>
                {t.generate}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </Button>
        </Panel>
      </form>
    </div>
  );
};

export default InputForm;
