'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserInputs, ResumeInput, InterviewReport, ReportType, UserProfile } from '@/types';
import { FileText, Upload, X, History, Clock, Pointer, Save, Puzzle, CreditCard, Sparkles, ScanSearch, BadgeDollarSign, ShieldAlert, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { validateJobDescription } from '@/lib/validate-job-description';
import { classifyJobInput } from '@/lib/url-parser-logic';
import SmartInputArea from '@/components/SmartInputArea';
import type { AppLanguage } from '@/lib/language-context';
import { RESUME_LIBRARY_LIMIT } from '@/constants/resumes';
import { REPORT_CODES, reportShortLabel, reportLabel } from '@/constants/report-products';
import { getHomepageFormCopy } from '@/constants/homepage-form-copy';
import BrandLogo from '@/components/BrandLogo';

const PILL =
  'inline-flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl xl:text-2xl text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 sm:px-4 lg:px-5 xl:px-6 py-2 sm:py-2.5 lg:py-3 rounded-full border border-indigo-500/20 transition-all whitespace-nowrap max-w-full';
const STEP_CONNECTOR =
  'hidden lg:flex items-center justify-center self-stretch px-1';
const STEP_COL =
  'relative flex min-h-0 min-w-0 flex-col rounded-2xl border border-slate-500/70 bg-gradient-to-b from-slate-500/45 to-slate-600/70 p-5 sm:p-8 lg:p-10 xl:p-12 shadow-xl';
const STEP_TITLE =
  'step-title flex min-h-[4rem] sm:min-h-[5rem] lg:min-h-[6.375rem] shrink-0 items-center pb-3 sm:pb-4 lg:pb-5 text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white';
const STEP_PILL_ROW = 'mb-4 sm:mb-5 lg:mb-6 flex min-h-[4rem] sm:min-h-[5.5rem] lg:min-h-[7rem] shrink-0 items-center';
/** Shared content shell height — steps 1–4 bottom boxes align */
const STEP_BODY_MIN = 'min-h-[28rem] sm:min-h-[35rem] lg:min-h-[42rem]';
const STEP_BODY = `flex ${STEP_BODY_MIN} flex-1 flex-col`;
/** Step 3 only — pure CSS grid so three cards share equal height (no flex+grid clash) */
const STEP_BODY_CARDS = `grid ${STEP_BODY_MIN} flex-1 grid-rows-3 gap-3 sm:gap-4 lg:gap-5`;
const STEP_BODY_CARDS_COMPACT = `grid ${STEP_BODY_MIN} flex-1 grid-rows-2 gap-3 sm:gap-4 lg:gap-5`;
const REPORT_CARD_IDLE =
  'border-dashed border-slate-600 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50';
const REPORT_CARD_ACTIVE =
  'border-solid border-blue-500 bg-blue-500/10 shadow-[0_0_0_1px_rgba(59,130,246,0.35)]';
const REPORT_CARD =
  'w-full min-h-0 h-full rounded-xl border-2 px-3 sm:px-4 lg:px-5 xl:px-6 py-3 sm:py-4 lg:py-5 text-left transition flex flex-col justify-center gap-2 sm:gap-2.5 lg:gap-3';

function StepSequenceMark() {
  return (
    <div className="flex items-center justify-center self-stretch">
      <div className={STEP_CONNECTOR} aria-hidden>
        <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-indigo-400 bg-slate-900 text-indigo-200 shadow-lg">
          <ChevronRight className="h-10 w-10" strokeWidth={2.75} />
        </span>
      </div>
      <div className="flex justify-center py-3 text-indigo-300 lg:hidden" aria-hidden>
        <ChevronDown className="h-10 w-10" strokeWidth={2.75} />
      </div>
    </div>
  );
}

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
  reportType?: ReportType;
  onReportTypeChange?: (type: ReportType) => void;
  /** When set, credits pill shows remaining Snapshot / Strategy counts */
  userProfile?: UserProfile | null;
  /**
   * When opened from Chrome extension (homepage /?sid=): show capture badge,
   * hide “Grab JD” CTA, and label the job step as already filled.
   */
  extensionCapture?: {
    company_name: string;
    job_title: string;
  } | null;
  /** Side panel / narrow: slightly tighter chrome */
  compactChrome?: boolean;
}

const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  isLoading,
  language = 'en',
  onLanguageChange,
  initialJobDescription,
  reportType = REPORT_CODES.JOB_FIT_SNAPSHOT,
  onReportTypeChange,
  userProfile = null,
  extensionCapture = null,
  compactChrome = false,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(language);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState<ResumeInput | null>(null);
  const [resumeHistory, setResumeHistory] = useState<SavedResume[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setResumeHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('resume_history')
        .select('id, type, content, mime_type, file_name, created_at, last_used_at, label')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('last_used_at', { ascending: false, nullsFirst: false })
        .limit(RESUME_LIBRARY_LIMIT);

      if (error) {
        const legacy = await supabase
          .from('resume_history')
          .select('id, type, content, mime_type, file_name, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(RESUME_LIBRARY_LIMIT);
        if (legacy.error) {
          if (legacy.error.code === '42P01' || legacy.error.message?.includes('does not exist')) {
            console.warn('resume_history 資料表尚未建立');
          } else {
            console.warn('無法載入履歷歷史', legacy.error.message);
          }
          setResumeHistory([]);
          return;
        }
        setResumeHistory(
          (legacy.data || [])
            .filter((item) => item.id && item.content && item.created_at)
            .map((item: any) => ({
              id: item.id,
              type: item.type,
              content: item.content,
              mimeType: item.mime_type,
              fileName: item.file_name,
              timestamp: new Date(item.created_at).getTime(),
            })),
        );
        return;
      }

      if (data && Array.isArray(data)) {
        const mappedData = data
          .filter(item => item.id && item.content && item.created_at)
          .map((item: any) => ({
            id: item.id,
            type: item.type,
            content: item.content,
            mimeType: item.mime_type,
            fileName: item.file_name || item.label,
            timestamp: new Date(item.last_used_at || item.created_at).getTime()
          }));

        setResumeHistory(mappedData);
      } else {
        setResumeHistory([]);
      }
    } catch (e: any) {
      console.warn("載入履歷歷史時發生非預期錯誤", {
        error: JSON.stringify(e, null, 2),
        message: e?.message,
        code: e?.code,
      });
      setResumeHistory([]);
    }
  };

  // 格式化時間：2026/1/17 21:30
  const formatDateTime = (dateStr: string | number) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const jobInputKind = classifyJobInput(jobDescription);

  const saveResumeToHistory = async (newResume: ResumeInput) => {
    const startTime = Date.now();
    console.log('🔵 [saveResumeToHistory] 開始儲存', { type: newResume.type, fileName: newResume.fileName });
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user || !user.id) {
        console.warn('⚠️ [saveResumeToHistory] User not logged in, skipping resume save.');
        alert('請先登入才能儲存履歷');
        return;
      }

      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: newResume }),
      });
      const data = await res.json().catch(() => ({}));
      const duration = Date.now() - startTime;

      if (!res.ok) {
        console.error('❌ [saveResumeToHistory] 儲存履歷失敗:', data);
        alert(`儲存失敗: ${data.error || '未知錯誤'}`);
        return;
      }

      console.log(`✅ 履歷儲存成功 (${duration}ms)`, data);
      loadResumeHistory().catch(e => console.warn('刷新履歷列表失敗:', e));
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (e: any) {
      console.error('❌ 儲存履歷時發生例外:', e?.message);
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

  const validateJobDescriptionLocal = (text: string): string | null => {
    const result = validateJobDescription(text, currentLanguage);
    return result.valid ? null : result.message;
  };

  const parsePublicAtsUrl = async (url: string): Promise<string | null> => {
    setIsParsingUrl(true);
    setJdError(null);
    try {
      const res = await fetch('/api/job-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.text !== 'string') {
        const msg =
          typeof data.error === 'string'
            ? data.error
            : currentLanguage === 'zh-TW' || currentLanguage === 'zh-CN'
              ? '無法解析此職缺網址，請改貼完整 JD 文字。'
              : 'Could not parse this job URL. Paste the full JD text instead.';
        setJdError(msg);
        return null;
      }
      setJobDescription(data.text);
      return data.text as string;
    } catch {
      setJdError(
        currentLanguage === 'zh-TW' || currentLanguage === 'zh-CN'
          ? '解析網址失敗，請稍後再試或改貼 JD 文字。'
          : 'URL parse failed. Retry or paste the JD text.',
      );
      return null;
    } finally {
      setIsParsingUrl(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const classification = classifyJobInput(jobDescription);

    if (classification.kind === 'blocked_board') {
      setJdError(null);
      return;
    }

    if (classification.kind === 'public_ats' && classification.url) {
      const text = await parsePublicAtsUrl(classification.url);
      if (!text) return;
      if (!resume) return;
      const validationError = validateJobDescriptionLocal(text);
      if (validationError) {
        setJdError(validationError);
        return;
      }
      onSubmit({ jobDescription: text, resume, language: currentLanguage });
      return;
    }

    if (classification.kind === 'other_url') {
      setJdError(
        currentLanguage === 'zh-TW' || currentLanguage === 'zh-CN'
          ? '⚠️ 請勿只貼網址。Greenhouse / Lever 可自動解析；其他請貼完整 JD 或使用外掛。'
          : '⚠️ URL only is not accepted. Greenhouse / Lever can auto-fetch; otherwise paste full JD or use the extension.',
      );
      return;
    }

    const validationError = validateJobDescriptionLocal(jobDescription);
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
    if (
      saved.mimeType === 'application/pdf'
      && typeof saved.content === 'string'
      && (
        saved.content.trim().startsWith('[PDF resume:')
        || saved.content.includes('[PDF resume attached]')
        || saved.content.includes('[Resume provided as PDF attachment]')
      )
    ) {
      alert(
        language === 'zh-TW' || language === 'zh-CN'
          ? '這份已存 PDF 只有檔名、沒有檔案內容。請重新上傳 PDF 後再分析。'
          : 'This saved PDF is incomplete (name only). Please re-upload the PDF file, then launch again.',
      );
      return;
    }
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

      // Soft-delete so historical analysis_reports.resume_id stays valid
      const { error } = await supabase
        .from('resume_history')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        // Fallback hard delete if soft-delete columns not migrated
        const hard = await supabase
          .from('resume_history')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (hard.error) {
          const errorMessage = hard.error.message || error.message || '未知錯誤';
          console.error('❌ 刪除履歷失敗', errorMessage);
          alert('刪除失敗：' + errorMessage);
          return;
        }
      }
      
      await loadResumeHistory();
    } catch (e: any) {
      const errorMessage = e?.message || '未知例外';
      console.error('❌ 刪除履歷時發生例外', errorMessage);
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

  const t = getHomepageFormCopy(currentLanguage);
  const zh = currentLanguage === 'zh-TW' || currentLanguage === 'zh-CN';
  const snapshotCredits =
    userProfile?.available_job_fit_snapshot_credits
    ?? userProfile?.available_lite_credits
    ?? null;
  const strategyCredits =
    userProfile?.available_interview_strategy_guide_credits
    ?? userProfile?.available_full_credits
    ?? null;
  const creditsPillShort = zh ? '報告額度' : 'Report credits';
  const creditsPillDetail = (() => {
    if (snapshotCredits == null || strategyCredits == null) {
      return zh ? '與方案' : '& plans';
    }
    if (snapshotCredits <= 0 && strategyCredits <= 0) {
      return zh ? '：加購' : ': buy more';
    }
    const snap = reportShortLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, currentLanguage);
    const strat = reportShortLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, currentLanguage);
    return `: ${snap} (${snapshotCredits}) + ${strat} (${strategyCredits})`;
  })();
  const creditsPillTitle = zh
    ? '剩餘額度：適配快照 / 面試指南（點此加購或管理帳戶）'
    : 'Remaining credits: Fit Snapshot / Interview Guide (buy more or manage account)';

  const blocked = jobInputKind.kind === 'blocked_board';
  const publicAts = jobInputKind.kind === 'public_ats';
  const submitLabel = publicAts
    ? resume
      ? zh
        ? '立即解析並分析'
        : 'Parse & analyze'
      : zh
        ? '解析網址'
        : 'Parse URL'
    : t.generate;
  const submitDisabled =
    isLoading ||
    isParsingUrl ||
    isSaving ||
    !jobDescription ||
    blocked ||
    (!publicAts && !resume);

  return (
    <div className={`flex w-full min-w-0 flex-col ${compactChrome ? 'gap-4' : 'gap-3 sm:gap-4 lg:gap-5'}`}>
      {/* Hero: large centered brand + tagline (matches prior homepage design) */}
      <div className={`w-full min-w-0 space-y-3 px-2 text-center ${compactChrome ? 'py-1' : 'pt-2 sm:pt-3 pb-0'}`}>
        <BrandLogo
          size={compactChrome ? 'nav' : 'hero'}
          showIcon
          as="h1"
          className="justify-center"
        />
        <p
          className={`homepage-hero-desc mx-auto w-full max-w-[160rem] text-center font-semibold leading-snug text-zinc-400 ${
            compactChrome ? 'text-sm sm:text-base md:text-lg' : ''
          }`}
        >
          {t.description}
        </p>
        {extensionCapture && (
          <p className="inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300/90">
            <Puzzle className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {zh ? '已從 Chrome 外掛抓取職缺' : 'Job captured via Chrome extension'}
            </span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className={`flex w-full min-w-0 flex-col ${compactChrome ? 'gap-4' : 'gap-8 sm:gap-12 lg:gap-16 xl:gap-20'}`}>
        {!compactChrome && (
          <div className="homepage-features grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-4 lg:gap-8">
            {([
              {
                id: 'fit',
                icon: ScanSearch,
                iconWrap: 'from-amber-500/25 to-amber-900/30 ring-amber-400/25',
                iconColor: 'text-amber-300',
                title: t.matchAnalysis,
                desc: t.matchAnalysisDesc,
              },
              {
                id: 'offer',
                icon: BadgeDollarSign,
                iconWrap: 'from-emerald-500/25 to-emerald-900/30 ring-emerald-400/25',
                iconColor: 'text-emerald-300',
                title: t.salaryResearch,
                desc: t.salaryResearchDesc,
              },
              {
                id: 'defenses',
                icon: ShieldAlert,
                iconWrap: 'from-sky-500/25 to-sky-900/30 ring-sky-400/25',
                iconColor: 'text-sky-300',
                title: t.industryAnalysis,
                desc: t.industryAnalysisDesc,
              },
              {
                id: 'playbook',
                icon: MessageSquare,
                iconWrap: 'from-violet-500/25 to-violet-900/30 ring-violet-400/25',
                iconColor: 'text-violet-300',
                title: t.interviewPrep,
                desc: t.interviewPrepDesc,
              },
            ] as const).map((item) => {
                const open = expandedFeature === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-expanded={open}
                    onMouseEnter={() => setExpandedFeature(item.id)}
                    onMouseLeave={() => setExpandedFeature((cur) => (cur === item.id ? null : cur))}
                    onFocus={() => setExpandedFeature(item.id)}
                    onBlur={() => setExpandedFeature((cur) => (cur === item.id ? null : cur))}
                    onClick={() => setExpandedFeature(open ? null : item.id)}
                    className="flex w-full items-center gap-3 sm:gap-4 lg:gap-5 rounded-2xl border border-slate-700 bg-slate-800/80 p-4 sm:p-6 lg:p-8 text-left shadow-xl backdrop-blur-sm transition-colors hover:bg-slate-700/40"
                  >
                    <div className={`shrink-0 rounded-xl bg-gradient-to-br p-3 sm:p-4 lg:p-5 shadow-inner ring-1 ${item.iconWrap}`}>
                      <Icon className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 ${item.iconColor}`} strokeWidth={1.75} absoluteStrokeWidth />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="feature-title text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold leading-snug text-zinc-400">{item.title}</span>
                        <ChevronDown
                          className={`mt-0.5 h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                          aria-hidden
                        />
                      </div>
                      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                          <p className="feature-desc pb-0.5 pt-2 sm:pt-2.5 text-sm sm:text-base lg:text-lg xl:text-2xl leading-normal text-slate-400">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        )}

        {/* Classic 1→4 operator: separate cards with sequence arrows */}
        <div className="homepage-steps grid w-full min-w-0 grid-cols-1 items-stretch gap-4 sm:gap-5 lg:grid-cols-[minmax(0,4fr)_auto_minmax(0,3fr)_auto_minmax(0,3fr)_auto_minmax(0,2fr)] lg:gap-x-4 lg:gap-y-6">
            {/* 1. Job */}
            <div className={STEP_COL}>
              <h2 className={STEP_TITLE}>
                <span className="mr-3 sm:mr-4 lg:mr-5 h-8 sm:h-9 lg:h-10 w-2 sm:w-2.5 shrink-0 rounded-full bg-indigo-500" />
                <span className="leading-snug">{t.jobData}</span>
              </h2>
              <div className={STEP_PILL_ROW}>
                {extensionCapture ? (
                  <span
                    className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300"
                    title={[extensionCapture.company_name, extensionCapture.job_title].filter(Boolean).join(' · ') || undefined}
                  >
                    <Puzzle className="h-4 w-4 shrink-0" />
                    <span className="truncate font-bold">
                      {zh ? '外掛已抓取 ✓' : 'Captured ✓'}
                      {[extensionCapture.company_name, extensionCapture.job_title].filter(Boolean).length > 0
                        ? ` · ${[extensionCapture.company_name, extensionCapture.job_title].filter(Boolean).join(' · ')}`
                        : ''}
                    </span>
                  </span>
                ) : (
                  <Link
                    href="/extension"
                    className={PILL}
                    title={zh ? '職缺頁可一鍵抓 JD，免手動貼上' : 'On a job page? Grab the JD in one click — no paste'}
                  >
                    <Puzzle className="h-4 w-4 shrink-0" />
                    <span className="font-bold">
                      {zh ? 'Chrome 外掛一鍵抓職缺 →' : 'Grab JD with Chrome extension →'}
                    </span>
                  </Link>
                )}
              </div>
              <div className={STEP_BODY}>
                <SmartInputArea
                  value={jobDescription}
                  onChange={(next) => {
                    setJobDescription(next);
                    if (jdError) setJdError(null);
                  }}
                  language={currentLanguage}
                  error={jdError}
                  parsing={isParsingUrl}
                  disabled={isLoading}
                  compact
                  hideExtensionHint
                  placeholder={t.jobUrlPlaceholder}
                  onBlurValidate={() => {
                    if (classifyJobInput(jobDescription).kind === 'blocked_board') {
                      setJdError(null);
                      return;
                    }
                    if (classifyJobInput(jobDescription).kind === 'public_ats') {
                      setJdError(null);
                      return;
                    }
                    const err = validateJobDescriptionLocal(jobDescription);
                    if (err) setJdError(err);
                  }}
                />
              </div>
            </div>
            <StepSequenceMark />

            {/* 2. Resume — overflow-visible so Saved Resumes dropdown can open */}
            <div className={`${STEP_COL} overflow-visible`}>
              <h2 className={STEP_TITLE}>
                <span className="mr-3 sm:mr-4 lg:mr-5 h-8 sm:h-9 lg:h-10 w-2 sm:w-2.5 shrink-0 rounded-full bg-violet-500" />
                <span className="whitespace-nowrap">{t.resume}</span>
              </h2>
              <div className={`relative z-40 ${STEP_PILL_ROW} overflow-visible`}>
                <button
                  type="button"
                  onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                  className={PILL}
                  aria-expanded={showHistoryDropdown}
                  aria-haspopup="listbox"
                >
                  <History className="h-[1em] w-[1em] shrink-0" />
                  <span className="font-bold">{t.resumeLibrary}</span>
                  {resumeHistory.length > 0 && <span className="font-bold">({resumeHistory.length})</span>}
                </button>
                {showHistoryDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowHistoryDropdown(false)}
                      aria-hidden
                    />
                    <div
                      role="listbox"
                      className="absolute left-0 top-full z-50 mt-[0.35em] max-h-[16em] w-[22em] max-w-[calc(100vw-2rem)] animate-fade-in overflow-y-auto rounded-2xl border border-slate-600 bg-slate-800 text-2xl shadow-2xl"
                    >
                      <div className="sticky top-0 border-b border-slate-700 bg-slate-900/95 px-[0.8em] py-[0.55em] text-lg font-bold uppercase tracking-wider text-slate-400">
                        {t.recentlyUploaded}
                      </div>
                      {resumeHistory.length === 0 ? (
                        <div className="p-[1.2em] text-center text-xl text-slate-500">
                          <p>{t.noResume}</p>
                        </div>
                      ) : (
                        resumeHistory.map((historyItem) => (
                          <div
                            key={historyItem.id}
                            role="option"
                            onClick={() => handleSelectResume(historyItem)}
                            className="group relative flex cursor-pointer items-start gap-[0.45em] border-b border-slate-700/50 px-[0.8em] py-[0.65em] transition-all last:border-0 hover:bg-slate-700"
                          >
                            <FileText className="mt-[0.15em] h-[1em] w-[1em] shrink-0 text-indigo-400" />
                            <div className="min-w-0 flex-1 overflow-hidden text-left">
                              <p className="truncate font-bold text-slate-200">{historyItem.fileName}</p>
                              <p className="mt-[0.2em] flex items-center text-lg text-slate-400">
                                <Clock className="mr-[0.35em] h-[1em] w-[1em]" />
                                {formatDateTime(historyItem.timestamp)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteResume(e, historyItem.id)}
                              className="rounded-lg p-[0.35em] text-slate-500 hover:bg-white/10 hover:text-red-400"
                              aria-label="Remove resume"
                            >
                              <X className="h-[1em] w-[1em]" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className={STEP_BODY}>
                {!resume ? (
                  <div className="relative flex h-full w-full flex-1 flex-col items-stretch justify-start rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/30 transition-all">
                    <label
                      htmlFor="resume-file-input"
                      className="group relative z-10 flex h-full w-full cursor-pointer flex-col items-start justify-start gap-2 rounded-xl px-3 py-4 text-left hover:bg-slate-700/30 sm:px-4 sm:py-5"
                    >
                      <div className="rounded-full border border-slate-700 bg-slate-800 p-3 sm:p-4 transition-colors group-hover:border-indigo-500/30 group-hover:bg-indigo-500/20">
                        <Upload className="h-7 w-7 sm:h-8 sm:w-8 lg:h-9 lg:w-9 text-slate-400 group-hover:text-indigo-400" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="upload-prompt text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-slate-400">{t.upload}</p>
                        <p className="upload-support mt-1.5 sm:mt-2 text-sm sm:text-base lg:text-lg xl:text-2xl font-medium leading-snug text-slate-400">{t.uploadSupport}</p>
                      </div>
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
                  <div className="flex h-full w-full flex-1 animate-fade-in flex-col justify-center gap-2 rounded-xl border border-indigo-500/50 bg-indigo-900/20 p-3 sm:p-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="shrink-0 rounded-lg bg-indigo-500 p-1.5">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="truncate text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white">{resume.fileName}</p>
                        <p className="text-sm sm:text-base lg:text-lg text-indigo-300">Ready for Analysis</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="ml-auto shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualSave}
                      disabled={isSaving}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                        isSaving
                          ? 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400/50'
                          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isSaving ? t.saving : t.save}
                    </button>
                  </div>
                )}
              </div>
            </div>
            <StepSequenceMark />

            {/* 3. Report type — Snapshot + Guide + Compare (3 equal boxes) */}
            <div className={STEP_COL}>
              <h2 className={STEP_TITLE}>
                <span className="mr-3 sm:mr-4 lg:mr-5 h-8 sm:h-9 lg:h-10 w-2 sm:w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <span className="leading-snug">{t.reportTypeStep}</span>
              </h2>
              <div className={STEP_PILL_ROW}>
                {onReportTypeChange ? (
                  <Link
                    href="/account"
                    className={`${PILL} group max-w-full`}
                    title={`${creditsPillShort}${creditsPillDetail} → — ${creditsPillTitle}`}
                  >
                    <CreditCard className="h-5 w-5 shrink-0" />
                    <span className="font-bold leading-snug">
                      {creditsPillShort}
                      <span className="hidden group-hover:inline group-focus-within:inline">
                        {creditsPillDetail}
                      </span>
                      {' →'}
                    </span>
                  </Link>
                ) : null}
              </div>
              {onReportTypeChange ? (
                <div className={compactChrome ? STEP_BODY_CARDS_COMPACT : STEP_BODY_CARDS}>
                  <div
                    className={`${REPORT_CARD} ${
                      reportType === REPORT_CODES.JOB_FIT_SNAPSHOT ? REPORT_CARD_ACTIVE : REPORT_CARD_IDLE
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onReportTypeChange(REPORT_CODES.JOB_FIT_SNAPSHOT)}
                      className="w-full min-w-0 text-left"
                    >
                      <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
                        {reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, currentLanguage)}
                      </p>
                      <p className="mt-1.5 sm:mt-2 text-sm sm:text-base lg:text-lg xl:text-2xl leading-snug text-slate-400">{t.snapshotBlurb}</p>
                    </button>
                  </div>
                  <div
                    className={`${REPORT_CARD} ${
                      reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE ? REPORT_CARD_ACTIVE : REPORT_CARD_IDLE
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onReportTypeChange(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}
                      className="w-full min-w-0 text-left"
                    >
                      <p className="flex flex-wrap items-center gap-2 text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-white">
                        {reportLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, currentLanguage)}
                        <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 shrink-0 text-violet-400" />
                      </p>
                      <p className="mt-1.5 sm:mt-2 text-sm sm:text-base lg:text-lg xl:text-2xl leading-snug text-slate-400">{t.strategyBlurb}</p>
                    </button>
                  </div>
                  {!compactChrome && (
                    <Link
                      href="/samples"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="compare-panel-label flex h-full w-full min-h-0 items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/30 px-3.5 py-3 text-2xl font-semibold leading-snug text-slate-100 transition hover:border-slate-500 hover:bg-slate-900/50"
                    >
                      <FileText className="h-8 w-8 shrink-0 text-indigo-300" aria-hidden />
                      {t.sampleLink}
                    </Link>
                  )}
                </div>
              ) : (
                <div className={`${STEP_BODY} text-sm text-slate-500`}>—</div>
              )}
            </div>
            <StepSequenceMark />

            {/* 4. Launch — same title/pill spacers so content box aligns */}
            <div className={`${STEP_COL} relative z-0 bg-slate-700/30`}>
              <h2 className={STEP_TITLE}>
                <span className="mr-3 sm:mr-4 lg:mr-5 h-8 sm:h-9 lg:h-10 w-2 sm:w-2.5 shrink-0 rounded-full bg-indigo-400" />
                <span className="leading-snug">{t.launchStep}</span>
              </h2>
              <div className={STEP_PILL_ROW} aria-hidden />
              <div className={`${STEP_BODY} relative z-10`}>
                <button
                  type="submit"
                  disabled={submitDisabled}
                  title={
                    submitDisabled
                      ? zh
                        ? '請先貼上完整職缺並上傳履歷'
                        : 'Paste the full job posting and upload a resume first'
                      : undefined
                  }
                  className={`flex h-full ${STEP_BODY_MIN} w-full flex-1 flex-col items-center justify-center gap-4 sm:gap-5 lg:gap-6 rounded-xl px-6 sm:px-8 lg:px-10 py-8 sm:py-9 lg:py-10 text-center text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-all ${
                    submitDisabled
                      ? 'cursor-not-allowed bg-indigo-600/35 text-white/55 shadow-none'
                      : publicAts
                        ? 'bg-emerald-600 shadow-emerald-500/30 hover:-translate-y-1 hover:bg-emerald-500 active:translate-y-0 active:bg-emerald-700'
                        : jdError
                          ? 'bg-red-600 shadow-red-500/30 hover:-translate-y-1 hover:bg-red-500 active:translate-y-0 active:bg-red-700'
                          : 'bg-indigo-600 hover:-translate-y-1 hover:bg-indigo-500 active:translate-y-0 active:bg-indigo-700'
                  }`}
                >
                  {isLoading || isParsingUrl ? (
                    <>
                      <svg className="h-10 w-10 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="animate-pulse text-lg leading-snug text-white/80">
                        {isParsingUrl ? (zh ? '解析中…' : 'Parsing…') : t.generating}
                      </span>
                    </>
                  ) : isSaving ? (
                    <span className="text-lg text-white/70">{t.waitingSave}</span>
                  ) : (
                    <>
                      <span className="px-1 leading-snug">{submitLabel}</span>
                      <Pointer className="h-[3.75rem] w-[3.75rem] shrink-0" aria-hidden />
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
