'use client';

/**
 * InputFormMobile - Mobile-optimized job analysis form (<1024px)
 * 
 * Key differences from InputForm (desktop):
 * - Compact stacked layout only (same copy and actions)
 * - Shared strings from constants/homepage-form-copy.ts
 */

import React, { useState, useRef, useEffect } from 'react';
import { UserInputs, ResumeInput, ReportType, UserProfile } from '@/types';
import { FileText, Upload, X, History, Clock, Save, Puzzle, CreditCard, Sparkles, Check, Pointer, ScanSearch, BadgeDollarSign, ShieldAlert, MessageSquare, ChevronDown } from 'lucide-react';
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

// Mobile-specific constants (NO responsive classes) - Ultra compact v2
const MOBILE_CONTAINER = 'w-full space-y-3 px-3 py-4';
const MOBILE_STEP_CARD = 'rounded-xl border border-slate-600 bg-slate-800/80 p-3 space-y-2.5 shadow-lg';
const MOBILE_STEP_TITLE = 'flex items-center gap-2 text-sm font-bold text-white/90';
const MOBILE_STEP_BADGE = 'h-5 w-1 rounded-full shrink-0';
const MOBILE_BUTTON_PRIMARY = 'w-full py-4 text-base font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg';
const MOBILE_PILL = 'inline-flex items-center gap-1.5 rounded-full border border-slate-600 bg-slate-700/50 px-2.5 py-1 text-xs text-slate-300 font-medium';

interface SavedResume extends ResumeInput {
  id: string;
  timestamp: number;
}

export interface InputFormProps {
  onSubmit: (inputs: UserInputs) => void;
  isLoading: boolean;
  language?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
  initialJobDescription?: string;
  reportType?: ReportType;
  onReportTypeChange?: (type: ReportType) => void;
  userProfile?: UserProfile | null;
  extensionCapture?: {
    company_name: string;
    job_title: string;
  } | null;
  compactChrome?: boolean;
}

const InputFormMobile: React.FC<InputFormProps> = ({
  onSubmit,
  isLoading,
  language = 'en',
  onLanguageChange,
  initialJobDescription,
  reportType = REPORT_CODES.JOB_FIT_SNAPSHOT,
  onReportTypeChange,
  userProfile = null,
  extensionCapture = null,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(language);
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState<ResumeInput | null>(null);
  const [resumeHistory, setResumeHistory] = useState<SavedResume[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [jdError, setJdError] = useState<string | null>(null);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResumeHistory();
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
        setResumeHistory([]);
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
      console.warn('載入履歷歷史失敗', e?.message);
      setResumeHistory([]);
    }
  };

  const formatDateTime = (dateStr: string | number) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
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
          ? '⚠️ 請勿只貼網址。請貼完整 JD 或使用外掛。'
          : '⚠️ URL only is not accepted. Paste full JD or use extension.',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert(t.fileTooLarge);
      return;
    }

    const processFile = (result: string, isPdf: boolean, isWord: boolean) => {
      const mimeType = isPdf ? 'application/pdf' : isWord
        ? (fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/msword')
        : undefined;
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
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (!result) {
          alert(`讀取 ${isPdf ? 'PDF' : 'Word'} 文件失敗，請重試`);
          return;
        }
        const base64String = result.split(',')[1];
        if (!base64String) {
          alert(`${isPdf ? 'PDF' : 'Word'} 文件編碼失敗，請重試`);
          return;
        }
        processFile(base64String, isPdf, isWord);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) {
          alert('讀取文本文件失敗，請重試');
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

  const saveResumeToHistory = async (newResume: ResumeInput) => {
    const zhLang = currentLanguage === 'zh-TW' || currentLanguage === 'zh-CN';
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.id) {
        alert(zhLang ? '請先登入才能儲存履歷' : 'Sign in to save a resume');
        return;
      }
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: newResume }),
      });
      const data: { error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errText = data.error ?? 'unknown error';
        alert(zhLang ? `儲存失敗: ${errText}` : `Save failed: ${errText}`);
        return;
      }
      await loadResumeHistory();
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch {
      alert(zhLang ? '儲存履歷失敗，請稍後再試' : 'Could not save resume. Try again.');
    }
  };

  const handleManualSave = async () => {
    if (!resume || isSaving) return;
    setIsSaving(true);
    try {
      await saveResumeToHistory(resume);
    } finally {
      setIsSaving(false);
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user || !user.id) {
        return;
      }

      const { error } = await supabase
        .from('resume_history')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) {
        const hard = await supabase
          .from('resume_history')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
        if (hard.error) {
          console.error('刪除履歷失敗', hard.error.message);
          return;
        }
      }
      
      await loadResumeHistory();
    } catch (e: any) {
      console.error('刪除履歷異常', e?.message);
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
  const creditsPillLabel = (() => {
    if (snapshotCredits == null || strategyCredits == null) {
      return zh ? '額度與方案 →' : 'Credits & plans →';
    }
    if (snapshotCredits <= 0 && strategyCredits <= 0) {
      return zh ? '加購額度 →' : 'Buy credits →';
    }
    const snap = reportShortLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, currentLanguage);
    const strat = reportShortLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, currentLanguage);
    return zh
      ? `額度：${snap} (${snapshotCredits}) + ${strat} (${strategyCredits}) →`
      : `Credits: ${snap} (${snapshotCredits}) + ${strat} (${strategyCredits}) →`;
  })();
  const creditsPillTitle = zh
    ? '剩餘額度：適配快照 / 面試指南（點此加購或管理帳戶）'
    : 'Remaining credits: Fit Snapshot / Interview Guide (buy more or manage account)';

  const jobInputKind = classifyJobInput(jobDescription);
  const blocked = jobInputKind.kind === 'blocked_board';
  const publicAts = jobInputKind.kind === 'public_ats';
  
  const submitLabel = publicAts
    ? resume
      ? zh ? '立即解析並分析' : 'Parse & analyze'
      : zh ? '解析網址' : 'Parse URL'
    : t.generate;
    
  const submitDisabled =
    isLoading ||
    isParsingUrl ||
    isSaving ||
    !jobDescription ||
    blocked ||
    (!publicAts && !resume);

  return (
    <div className={MOBILE_CONTAINER}>
      {/* Hero: Simplified mobile version */}
      <div className="text-center space-y-1">
        <BrandLogo size="nav" showIcon as="h1" className="justify-center" />
        <p className="homepage-hero-desc px-2 text-center text-[0.6rem] font-semibold leading-snug text-slate-400">
          {t.description}
        </p>
        {extensionCapture && (
          <p className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            <Puzzle className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {zh ? '已從 Chrome 外掛抓取職缺' : 'Job captured via Chrome extension'}
            </span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="rounded-xl border border-indigo-500/30 bg-slate-800/80 overflow-hidden shadow-sm">
          <button
            type="button"
            aria-expanded={featuresOpen}
            aria-label={
              featuresOpen
                ? zh
                  ? '收合 Jobbeagle 優點'
                  : 'Collapse Jobbeagle advantages'
                : zh
                  ? '展開 Jobbeagle 優點'
                  : 'Expand Jobbeagle advantages'
            }
            onClick={() => setFeaturesOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left active:bg-slate-700/50"
          >
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-100">
                {t.featuresAccordion}
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-indigo-300/90">
                {featuresOpen
                  ? zh
                    ? '點此收合'
                    : 'Tap to collapse'
                  : zh
                    ? '點此展開 ▼'
                    : 'Tap to expand ▼'}
              </span>
            </span>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/15 transition-transform ${
                featuresOpen ? 'rotate-180' : ''
              }`}
              aria-hidden
            >
              <ChevronDown className="h-5 w-5 text-indigo-300" strokeWidth={2.5} />
            </span>
          </button>
          {featuresOpen && (
            <div className="space-y-2 border-t border-slate-700 px-3 py-2.5">
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
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <div className={`shrink-0 rounded-lg bg-gradient-to-br p-1.5 shadow-inner ring-1 ${item.iconWrap}`}>
                      <Icon className={`h-4 w-4 ${item.iconColor}`} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-snug text-slate-200">{item.title}</p>
                      <p className="pt-0.5 text-[11px] leading-normal text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Step 1: Job */}
        <div className={MOBILE_STEP_CARD}>
          <h2 className={MOBILE_STEP_TITLE}>
            <span className={`${MOBILE_STEP_BADGE} bg-indigo-500`} />
            <span>{t.jobData}</span>
          </h2>
          {extensionCapture ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/25 rounded-lg">
              <Puzzle className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="text-xs text-emerald-300 font-medium truncate">
                {zh ? '已從 Chrome 外掛抓取職缺' : 'Job captured via Chrome extension'}
                {[extensionCapture.company_name, extensionCapture.job_title].filter(Boolean).length > 0
                  ? ` · ${[extensionCapture.company_name, extensionCapture.job_title].filter(Boolean).join(' · ')}`
                  : ''}
              </span>
            </div>
          ) : (
            <Link
              href="/extension"
              className={MOBILE_PILL}
              title={zh ? '職缺頁可一鍵抓 JD，免手動貼上' : 'On a job page? Grab the JD in one click — no paste'}
            >
              <Puzzle className="h-4 w-4 shrink-0" />
              <span className="font-bold">
                {zh ? 'Chrome 外掛一鍵抓職缺 →' : 'Grab JD with Chrome extension →'}
              </span>
            </Link>
          )}
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
          />
        </div>

        {/* Step 2: Resume */}
        <div className={MOBILE_STEP_CARD}>
          <h2 className={MOBILE_STEP_TITLE}>
            <span className={`${MOBILE_STEP_BADGE} bg-violet-500`} />
            <span>{t.resume}</span>
          </h2>
          
          {/* Resume history pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
              className={MOBILE_PILL}
            >
              <History className="h-4 w-4 shrink-0" />
              <span>{t.resumeLibrary}</span>
              {resumeHistory.length > 0 && <span>({resumeHistory.length})</span>}
            </button>
            
            {showHistoryDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowHistoryDropdown(false)}
                />
                <div className="absolute left-0 top-full z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-lg border border-slate-600 bg-slate-800 shadow-2xl">
                  <div className="sticky top-0 bg-slate-900/95 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                    {t.resumeLibrary}
                  </div>
                  {resumeHistory.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500">
                      {t.noResume}
                    </div>
                  ) : (
                    resumeHistory.map((historyItem) => (
                      <div
                        key={historyItem.id}
                        onClick={() => handleSelectResume(historyItem)}
                        className="flex items-start gap-1.5 border-b border-slate-700/50 px-2.5 py-2 cursor-pointer hover:bg-slate-700 transition-colors last:border-0"
                      >
                        <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-200">{historyItem.fileName}</p>
                          <p className="flex items-center text-[10px] text-slate-400 mt-0.5">
                            <Clock className="mr-1 h-2.5 w-2.5" />
                            {formatDateTime(historyItem.timestamp)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteResume(e, historyItem.id)}
                          className="rounded p-0.5 text-slate-500 hover:bg-white/10 hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Upload area */}
          {!resume ? (
            <label className="block w-full min-h-[100px] border-2 border-dashed border-slate-600 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-700/30 transition-colors">
              <Upload className="w-6 h-6 mx-auto mb-1.5 text-slate-400" />
              <p className="text-sm font-bold text-slate-400 mb-0.5">{t.upload}</p>
              <p className="text-xs text-slate-400 leading-tight">{t.uploadSupport}</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.md"
                className="hidden"
              />
            </label>
          ) : (
            <>
              <div className="flex items-center gap-2 p-2.5 bg-indigo-900/20 border border-indigo-500/50 rounded-lg">
                <div className="shrink-0 rounded-lg bg-indigo-500 p-1.5">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{resume.fileName}</p>
                  <p className="text-xs text-indigo-300">✓ {zh ? '已準備' : 'Ready'}</p>
                </div>
                <button
                  type="button"
                  onClick={clearFile}
                  className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white/10"
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
                {isSaving ? t.saving : showSaveSuccess ? t.saved : t.save}
              </button>
            </>
          )}
        </div>

        {/* Step 3: Report Type */}
        <div className={MOBILE_STEP_CARD}>
          <h2 className={MOBILE_STEP_TITLE}>
            <span className={`${MOBILE_STEP_BADGE} bg-emerald-500`} />
            <span>{t.reportTypeStep}</span>
          </h2>
          
          {onReportTypeChange ? (
            <Link href="/account" className={MOBILE_PILL} title={creditsPillTitle}>
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="truncate font-bold">{creditsPillLabel}</span>
            </Link>
          ) : null}

          {onReportTypeChange ? (
            <div className="space-y-1.5">
              <div
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onReportTypeChange(REPORT_CODES.JOB_FIT_SNAPSHOT)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="whitespace-normal text-sm font-bold text-white">
                      {reportLabel(REPORT_CODES.JOB_FIT_SNAPSHOT, currentLanguage)}
                    </p>
                    {reportType === REPORT_CODES.JOB_FIT_SNAPSHOT && (
                      <Check className="h-5 w-5 text-emerald-400" strokeWidth={3} />
                    )}
                  </div>
                  <p className="whitespace-normal text-xs leading-snug text-slate-300">{t.snapshotBlurb}</p>
                </button>
              </div>

              <div
                className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                  reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onReportTypeChange(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="flex items-center gap-1 whitespace-normal text-sm font-bold text-white">
                      {reportLabel(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE, currentLanguage)}
                      <Sparkles className="h-4 w-4 text-violet-400" />
                    </p>
                    {reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE && (
                      <Check className="h-5 w-5 text-emerald-400" strokeWidth={3} />
                    )}
                  </div>
                  <p className="whitespace-normal text-xs leading-snug text-slate-300">{t.strategyBlurb}</p>
                </button>
              </div>

              <Link
                href="/samples"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-600 bg-slate-900/40 px-3 py-2 text-sm font-semibold text-slate-100 hover:border-slate-500 transition-colors"
              >
                <FileText className="h-4 w-4 shrink-0 text-indigo-300" aria-hidden />
                {t.sampleLink}
              </Link>
            </div>
          ) : (
            <div className="text-xs text-slate-500">—</div>
          )}
        </div>

        <div className={MOBILE_STEP_CARD}>
          <h2 className={MOBILE_STEP_TITLE}>
            <span className={`${MOBILE_STEP_BADGE} bg-indigo-400`} />
            <span>{t.launchStep}</span>
          </h2>
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
            className={`${MOBILE_BUTTON_PRIMARY} flex flex-col items-center justify-center gap-2 ${
              submitDisabled
                ? 'bg-indigo-600/35 text-white/55 cursor-not-allowed'
                : publicAts
                  ? 'bg-emerald-600 text-white'
                  : jdError
                    ? 'bg-red-600 text-white'
                    : 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:from-indigo-700 active:to-indigo-600 text-white'
            }`}
          >
            {isLoading || isParsingUrl ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">{isParsingUrl ? (zh ? '解析中…' : 'Parsing…') : t.generating}</span>
              </span>
            ) : isSaving ? (
              <span className="text-sm text-white/70">{t.waitingSave}</span>
            ) : (
              <>
                <Pointer className="h-9 w-9" aria-hidden />
                <span className="text-base font-bold">{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputFormMobile;
