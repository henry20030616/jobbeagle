'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserInputs, ResumeInput, InterviewReport, ReportType, UserProfile } from '@/types';
import { FileText, Upload, X, History, Clock, ArrowRight, Save, Puzzle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { validateJobDescription } from '@/lib/validate-job-description';
import { classifyJobInput } from '@/lib/url-parser-logic';
import SmartInputArea from '@/components/SmartInputArea';
import ReportCompareModal from '@/components/ReportCompareModal';
import type { AppLanguage } from '@/lib/language-context';
import { RESUME_LIBRARY_LIMIT } from '@/constants/resumes';
import { REPORT_CODES, reportShortLabel } from '@/constants/report-products';
import { SAMPLE_LINK_BTN } from '@/constants/report-frame';

/** Homepage type scale — Stripe/Linear-like hierarchy */
const TYPE_TAGLINE = 'text-base sm:text-lg text-zinc-400 leading-relaxed';
const TYPE_STEP = 'text-xl font-semibold text-white leading-snug';
const TYPE_CARD = 'text-base font-semibold text-white leading-snug';
const TYPE_BODY = 'text-sm text-zinc-400 leading-relaxed';
const TYPE_BODY_STRONG = 'text-sm font-medium text-zinc-100 leading-relaxed';
const TYPE_META = 'text-sm text-zinc-400 leading-relaxed';
const TYPE_PILL =
  'inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded-full border border-indigo-500/20 transition-all max-w-full';
const STEP_SECTION =
  'flex h-full min-h-0 flex-col gap-4 p-6 min-w-0 max-w-full border-b lg:border-b-0 lg:border-r border-slate-700/80';
const STEP_BODY =
  'flex min-h-0 min-w-0 flex-1 flex-col';
const TYPE_LAUNCH =
  'w-full min-h-0 flex-1 min-w-0 rounded-xl px-5 py-5 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all transition-transform flex flex-col justify-center items-center gap-2 text-center leading-relaxed';

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
   * When opened from Chrome extension (/confirm): show capture badge,
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

  type TKeys = { title: string; subtitle: string; description: string; jobDescription: string; upload: string; save: string; saving: string; saved: string; saveFailed: string; generate: string; resumeLibrary: string; recentReports: string; noResume: string; recentlyUploaded: string; engineIntro: string; engineDescription: string; reportOutput: string; matchAnalysis: string; matchAnalysisDesc: string; salaryResearch: string; salaryResearchDesc: string; industryAnalysis: string; industryAnalysisDesc: string; interviewPrep: string; interviewPrepDesc: string; jobData: string; jobStepHint: string; jdFullTextHint: string; inputJobUrl: string; jobUrlPlaceholder: string; urlTip: string; resume: string; reportTypeStep: string; snapshotBlurb: string; strategyBlurb: string; uploadSupport: string; waitingSave: string; generating: string; fileTooLarge: string };
  const translations: Record<AppLanguage, TKeys> = {
    'zh-TW': { title: 'Jobbeagle', subtitle: '職位分析米格魯', description: '專家級 AI 職缺戰略分析：結合求職專家與獵頭視角，深度解析 JD 背後的組織需求與市場格局，助您掌握應對策略。', jobDescription: '職缺描述 (JD)', upload: '點擊上傳 PDF 或文字檔', save: '儲存', saving: '儲存中...', saved: '✓ 已儲存!', saveFailed: '儲存失敗，請重試', generate: '啟動AI戰略分析', resumeLibrary: '已存履歷', recentReports: '近期分析報告', noResume: '尚未儲存任何履歷', recentlyUploaded: '最近上傳的履歷', engineIntro: '戰略引擎簡介', engineDescription: 'Jobbeagle 搭載頂級人資與求職專家分析邏輯，深度解析 JD 背後的組織需求與市場格局。', reportOutput: '深度報告產出項', matchAnalysis: 'Candidate Fit Score', matchAnalysisDesc: '0–100 匹配分數、Beagle 等級、優勢／缺口與 Apply Decision——決定要不要投。', salaryResearch: 'Expected Offer Range', salaryResearchDesc: '依證據層級 A–D 的可期待薪酬區間，不是模型瞎猜的公司 offer。', industryAnalysis: 'Concerns & Defenses', industryAnalysisDesc: '招募最可能質疑的三件事，以及履歷真實證據的答題範本（Strategy Guide）。', interviewPrep: 'Interview Playbook', interviewPrepDesc: '公開／預測面試題、STAR 答題範本與談薪腳本（Strategy Guide）。', jobData: '1. 職缺資訊', jobStepHint: '貼上完整職缺內容，或', jdFullTextHint: '請貼上公司名稱、職缺名稱，以及完整職缺內文（含條件與職責）；勿只貼職責段落或網址。', inputJobUrl: '職缺內容', jobUrlPlaceholder: '請貼上公司、職缺名稱與完整職缺內文…', urlTip: '偵測到網址：請改為到職缺頁手動複製完整內容後貼上。', resume: '2. 我的履歷', reportTypeStep: '3. 選擇報告類型', snapshotBlurb: '無聯網 · 匹配分數 · 薪酬定位', strategyBlurb: '含完整 Snapshot · 即時情報 · STAR · 談判', uploadSupport: '支援 .pdf, .doc, .docx, .txt, .md (Max 4MB)', waitingSave: '請等待儲存完成...', generating: '生成深度戰略報告...', fileTooLarge: '檔案大小超過 4MB，請上傳較小的檔案。' },
    'zh-CN': { title: 'Jobbeagle', subtitle: '职位分析猎犬', description: '专家级 AI 职位战略分析：结合求职专家与猎头视角，深度解析 JD 背后的组织需求与市场格局，助您掌握应对策略。', jobDescription: '职位描述 (JD)', upload: '点击上传 PDF 或文本文件', save: '保存', saving: '保存中...', saved: '✓ 已保存!', saveFailed: '保存失败，请重试', generate: '启动AI战略分析', resumeLibrary: '已存简历', recentReports: '近期分析报告', noResume: '尚未保存任何简历', recentlyUploaded: '最近上传的简历', engineIntro: '战略引擎简介', engineDescription: 'Jobbeagle 搭载顶级人资与求职专家分析逻辑，深度解析 JD 背后的组织需求与市场格局。', reportOutput: '深度报告产出项', matchAnalysis: 'Candidate Fit Score', matchAnalysisDesc: '0–100 匹配分数、Beagle 等级、优势／缺口与 Apply Decision——决定要不要投。', salaryResearch: 'Expected Offer Range', salaryResearchDesc: '依证据层级 A–D 的可期待薪酬区间，不是模型瞎猜的公司 offer。', industryAnalysis: 'Concerns & Defenses', industryAnalysisDesc: '招募最可能质疑的三件事，以及简历真实证据的答题范本（Strategy Guide）。', interviewPrep: 'Interview Playbook', interviewPrepDesc: '公开／预测面试题、STAR 答题范本与谈薪脚本（Strategy Guide）。', jobData: '1. 职位信息', jobStepHint: '粘贴完整职位内容，或', jdFullTextHint: '请粘贴公司名称、职位名称，以及完整职位正文（含条件与职责）；勿只贴职责段落或网址。', inputJobUrl: '职位内容', jobUrlPlaceholder: '请粘贴公司、职位名称与完整职位描述…', urlTip: '检测到网址：请改为到职位页手动复制完整内容后粘贴。', resume: '2. 我的简历', reportTypeStep: '3. 选择报告类型', snapshotBlurb: '无联网 · 匹配分数 · 薪酬定位', strategyBlurb: '含完整 Snapshot · 即时情报 · STAR · 谈判', uploadSupport: '支持 .pdf, .doc, .docx, .txt, .md (最大 4MB)', waitingSave: '请等待保存完成...', generating: '生成深度战略报告...', fileTooLarge: '文件大小超过 4MB，请上传较小的文件。' },
    en: { title: 'Jobbeagle', subtitle: '(Job Analysis Beagle)', description: 'Expert-level AI Job Strategy Analysis: career-expert and headhunter logic that reads organizational needs and market dynamics behind every JD—so you master response strategies.', jobDescription: 'Job Description (JD)', upload: 'Click to upload PDF or text file', save: 'Save', saving: 'Saving...', saved: '✓ Saved!', saveFailed: 'Save failed, please try again', generate: 'Launch AI Strategy Analysis', resumeLibrary: 'Saved Resumes', recentReports: 'Recent Analysis Reports', noResume: 'No resumes saved yet', recentlyUploaded: 'Recently uploaded resumes', engineIntro: 'Strategic Engine Introduction', engineDescription: 'Jobbeagle is equipped with top-tier HR and career expert analysis logic, deeply analyzing organizational needs and market dynamics behind JDs.', reportOutput: 'In-Depth Report Outputs', matchAnalysis: 'Candidate Fit Score', matchAnalysisDesc: '0–100 fit score, Beagle tier, strengths/gaps, and Apply Decision — should you apply?', salaryResearch: 'Expected Offer Range', salaryResearchDesc: 'Evidence-tiered (A–D) offer band you can reasonably expect — never invented company offers.', industryAnalysis: 'Concerns & Defenses', industryAnalysisDesc: 'The three recruiter risks most likely to surface — plus answer templates from your real resume (Strategy Guide).', interviewPrep: 'Interview Playbook', interviewPrepDesc: 'Cited vs predicted questions, STAR answer templates, and offer negotiation scripts (Strategy Guide).', jobData: '1. Job Information', jobStepHint: 'Paste the full job posting, or', jdFullTextHint: 'Include company name, job title, and the full description (requirements and responsibilities). Don’t paste only the body text or a URL.', inputJobUrl: 'Job posting', jobUrlPlaceholder: 'Paste company, title, and full JD text…', urlTip: 'URL detected: open the posting and paste the full copied text instead.', resume: '2. My Resume', reportTypeStep: '3. Report type', snapshotBlurb: 'No web search · Match score · Comp positioning', strategyBlurb: 'Includes Snapshot + live intel · STAR · Negotiation', uploadSupport: 'Supports .pdf, .doc, .docx, .txt, .md (Max 4MB)', waitingSave: 'Please wait for save to complete...', generating: 'Generating in-depth strategic report...', fileTooLarge: 'File size exceeds 4MB, please upload a smaller file.' },
    es: { title: 'Jobbeagle', subtitle: '(Beagle de Análisis de Empleo)', description: 'Análisis de estrategia laboral con IA: lógica de expertos y headhunters que lee las necesidades organizacionales y la dinámica de mercado detrás de cada JD.', jobDescription: 'Descripción del Puesto (JD)', upload: 'Haz clic para subir PDF o archivo de texto', save: 'Guardar', saving: 'Guardando...', saved: '✓ Guardado!', saveFailed: 'Error al guardar, inténtalo de nuevo', generate: 'Iniciar Análisis de Estrategia IA', resumeLibrary: 'CVs guardados', recentReports: 'Informes de Análisis Recientes', noResume: 'No hay CV guardados aún', recentlyUploaded: 'CV subidos recientemente', engineIntro: 'Introducción al Motor Estratégico', engineDescription: 'Jobbeagle está equipado con lógica de análisis de RR.HH. y expertos en carrera de primer nivel, analizando en profundidad las necesidades organizacionales detrás de los JD.', reportOutput: 'Resultados del Informe en Profundidad', matchAnalysis: 'Candidate Fit Score', matchAnalysisDesc: 'Puntuación 0–100, nivel Beagle, fortalezas/brechas y Apply Decision.', salaryResearch: 'Expected Offer Range', salaryResearchDesc: 'Rango de oferta con nivel de evidencia A–D — sin inventar ofertas de empresa.', industryAnalysis: 'Concerns & Defenses', industryAnalysisDesc: 'Tres preocupaciones del reclutador y plantillas de respuesta (Strategy Guide).', interviewPrep: 'Interview Playbook', interviewPrepDesc: 'Preguntas citadas vs previstas, plantillas STAR y guion de negociación (Strategy Guide).', jobData: '1. Información del Puesto', jobStepHint: 'Pega la oferta completa, o', jdFullTextHint: 'Incluye nombre de la empresa, puesto y la descripción completa (requisitos y responsabilidades). No pegues solo el cuerpo o una URL.', inputJobUrl: 'Oferta de trabajo', jobUrlPlaceholder: 'Pega empresa, puesto y texto completo del JD…', urlTip: 'URL detectada: abre la oferta y pega el texto completo copiado.', resume: '2. Mi CV', reportTypeStep: '3. Tipo de informe', snapshotBlurb: 'Sin web · Puntuación · Compensación', strategyBlurb: 'Incluye Snapshot + intel · STAR · Negociación', uploadSupport: 'Compatible con .pdf, .doc, .docx, .txt, .md (Máx 4MB)', waitingSave: 'Espera a que se complete el guardado...', generating: 'Generando informe estratégico en profundidad...', fileTooLarge: 'El tamaño del archivo supera los 4MB, por favor sube un archivo más pequeño.' },
    hi: { title: 'Jobbeagle', subtitle: '(जॉब विश्लेषण बीगल)', description: 'विशेषज्ञ-स्तरीय AI नौकरी रणनीति विश्लेषण केंद्र: करियर विशेषज्ञ विश्लेषण और हेडहंटर दृष्टिकोण को मिलाकर आपकी प्रतिक्रिया रणनीतियों में मदद करता है।', jobDescription: 'नौकरी विवरण (JD)', upload: 'PDF या टेक्स्ट फ़ाइल अपलोड करने के लिए क्लिक करें', save: 'सहेजें', saving: 'सहेजा जा रहा है...', saved: '✓ सहेजा गया!', saveFailed: 'सहेजने में विफल, पुनः प्रयास करें', generate: 'AI रणनीति विश्लेषण शुरू करें', resumeLibrary: 'सहेजे गए CV', recentReports: 'हाल के विश्लेषण रिपोर्ट', noResume: 'अभी तक कोई CV नहीं सहेजा गया', recentlyUploaded: 'हाल ही में अपलोड किए गए CV', engineIntro: 'रणनीतिक इंजन परिचय', engineDescription: 'Jobbeagle शीर्ष-स्तरीय HR और करियर विशेषज्ञ विश्लेषण तर्क से लैस है, JD के पीछे संगठनात्मक जरूरतों का गहन विश्लेषण करता है।', reportOutput: 'गहन रिपोर्ट आउटपुट', matchAnalysis: 'Candidate Fit Score', matchAnalysisDesc: '0–100 स्कोर, Beagle टियर, strengths/gaps और Apply Decision।', salaryResearch: 'Expected Offer Range', salaryResearchDesc: 'Evidence tier A–D वाला ऑफर बैंड — कंपनी ऑफर का आविष्कार नहीं।', industryAnalysis: 'Concerns & Defenses', industryAnalysisDesc: 'तीन recruiter चिंताएँ + उत्तर टेम्पलेट (Strategy Guide)।', interviewPrep: 'Interview Playbook', interviewPrepDesc: 'Cited/predicted प्रश्न, STAR टेम्पलेट और negotiation स्क्रिप्ट (Strategy Guide)।', jobData: '1. नौकरी की जानकारी', jobStepHint: 'पूरी जॉब पोस्टिंग पेस्ट करें, या', jdFullTextHint: 'कंपनी नाम, पदनाम, और पूरा विवरण (आवश्यकताएँ व जिम्मेदारियाँ) शामिल करें। केवल बॉडी टेक्स्ट या URL न पेस्ट करें।', inputJobUrl: 'नौकरी पोस्टिंग', jobUrlPlaceholder: 'कंपनी, पद और पूरा JD टेक्स्ट पेस्ट करें…', urlTip: 'URL पाया गया: पोस्टिंग खोलें और पूरा कॉपी किया हुआ टेक्स्ट पेस्ट करें।', resume: '2. मेरा CV', reportTypeStep: '3. रिपोर्ट प्रकार', snapshotBlurb: 'बिना वेब · मैच स्कोर · मुआवजा', strategyBlurb: 'Snapshot + लाइव intel · STAR · बातचीत', uploadSupport: '.pdf, .doc, .docx, .txt, .md सपोर्ट करता है (अधिकतम 4MB)', waitingSave: 'कृपया सेव पूरा होने तक प्रतीक्षा करें...', generating: 'गहन रणनीतिक रिपोर्ट तैयार की जा रही है...', fileTooLarge: 'फ़ाइल का आकार 4MB से अधिक है, कृपया छोटी फ़ाइल अपलोड करें।' },
    ar: { title: 'Jobbeagle', subtitle: '(بيغل تحليل الوظائف)', description: 'مركز تحليل استراتيجية الوظائف بالذكاء الاصطناعي: يجمع بين تحليل خبراء المسار المهني ومنظور مسؤولي التوظيف لمساعدتك على إتقان استراتيجية التقديم.', jobDescription: 'وصف الوظيفة (JD)', upload: 'انقر لرفع ملف PDF أو ملف نصي', save: 'حفظ', saving: 'جارٍ الحفظ...', saved: '✓ تم الحفظ!', saveFailed: 'فشل الحفظ، يرجى المحاولة مرة أخرى', generate: 'بدء تحليل استراتيجية الذكاء الاصطناعي', resumeLibrary: 'السير المحفوظة', recentReports: 'تقارير التحليل الأخيرة', noResume: 'لا توجد سير ذاتية محفوظة بعد', recentlyUploaded: 'السير الذاتية المرفوعة مؤخرًا', engineIntro: 'مقدمة محرك الاستراتيجية', engineDescription: 'يعتمد Jobbeagle على منطق تحليل متخصص في الموارد البشرية والمسار المهني لفهم احتياجات المنظمة والسوق خلف وصف الوظيفة بعمق.', reportOutput: 'مخرجات التقرير المتعمق', matchAnalysis: 'Candidate Fit Score', matchAnalysisDesc: 'درجة 0–100 ومستوى Beagle ونقاط القوة/الفجوات وApply Decision.', salaryResearch: 'Expected Offer Range', salaryResearchDesc: 'نطاق عرض بأدلة A–D — دون اختراع عروض الشركة.', industryAnalysis: 'Concerns & Defenses', industryAnalysisDesc: 'ثلاثة مخاوف للمجنّد وقوالب إجابة (Strategy Guide).', interviewPrep: 'Interview Playbook', interviewPrepDesc: 'أسئلة موثقة/متوقعة وقوالب STAR وسيناريو تفاوض (Strategy Guide).', jobData: '1. معلومات الوظيفة', jobStepHint: 'الصق إعلان الوظيفة بالكامل، أو', jdFullTextHint: 'أدرج اسم الشركة والمسمى الوظيفي والوصف الكامل (المتطلبات والمسؤوليات). لا تلصق نص المتطلبات فقط أو رابطًا.', inputJobUrl: 'إعلان الوظيفة', jobUrlPlaceholder: 'الصق الشركة والمسمى ونص الوظيفة كاملاً…', urlTip: 'تم اكتشاف رابط: افتح الإعلان والصق النص الكامل المنسوخ بدلًا منه.', resume: '2. سيرتي الذاتية', reportTypeStep: '3. نوع التقرير', snapshotBlurb: 'بدون بحث ويب · درجة التوافق · التعويض', strategyBlurb: 'يشمل Snapshot + معلومات حية · STAR · تفاوض', uploadSupport: 'يدعم .pdf و .doc و .docx و .txt و .md (حتى 4MB)', waitingSave: 'يرجى الانتظار حتى يكتمل الحفظ...', generating: 'جارٍ إنشاء التقرير الاستراتيجي المتعمق...', fileTooLarge: 'حجم الملف يتجاوز 4MB، يرجى رفع ملف أصغر.' },
  };


  const t = translations[currentLanguage];
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
    ? '剩餘額度：匹配快照 / 面試策略（點此加購或管理帳戶）'
    : 'Remaining credits: Snapshot / Strategy Guide (buy more or manage account)';

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
    <div className="flex w-full min-w-0 flex-col gap-4">
      {/* Tagline only — logo lives in page header */}
      <div className="w-full min-w-0 space-y-3 px-2 text-center">
        <h1 className="sr-only">Jobbeagle</h1>
        <p className={`${TYPE_TAGLINE} mx-auto w-full max-w-3xl break-words`}>
          {t.description}
        </p>
        {extensionCapture && (
          <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-3 py-2 max-w-full">
            <Puzzle className="w-4 h-4 shrink-0" />
            <span className="truncate">
              {zh ? '已從 Chrome 外掛抓取職缺' : 'Job captured via Chrome extension'}
            </span>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full min-w-0">
        {/* Steps 1→4 left-to-right on lg+; each column minmax(0,1fr) so the row never exceeds 100%. */}
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border-2 border-blue-500 bg-slate-950 shadow-xl">
          <div className="jb-home-steps grid w-full min-w-0 grid-cols-1">
            {/* 1. Job */}
            <section className={STEP_SECTION}>
              <h2 className={`${TYPE_STEP} flex items-center gap-2.5 min-w-0`}>
                <span className="w-1.5 h-5 bg-indigo-500 rounded-full shrink-0" />
                <span className="truncate">{t.jobData}</span>
              </h2>
              <div className="flex flex-col gap-2.5 min-w-0">
                <p className={TYPE_BODY}>
                  {extensionCapture
                    ? (zh
                        ? '請確認外掛抓取的職缺內容，必要時可微調後再分析。'
                        : 'Review the captured job — edit if needed, then continue.')
                    : t.jobStepHint}
                </p>
                {extensionCapture ? (
                  <div className="inline-flex flex-col gap-1.5 max-w-full min-w-0">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 bg-emerald-500/10 px-3 py-2 rounded-full border border-emerald-500/25 w-fit max-w-full">
                      <Puzzle className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {zh ? '外掛已抓取 ✓' : 'Captured ✓'}
                      </span>
                    </span>
                    <span className={`${TYPE_META} truncate`} title={`${extensionCapture.company_name} · ${extensionCapture.job_title}`}>
                      {[extensionCapture.company_name, extensionCapture.job_title].filter(Boolean).join(' · ') || '—'}
                    </span>
                  </div>
                ) : (
                  <Link href="/extension" className={`${TYPE_PILL} w-fit`}>
                    <Puzzle className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {zh ? 'Chrome 外掛一鍵抓職缺 →' : 'Grab JD with extension →'}
                    </span>
                  </Link>
                )}
              </div>
              <div className={`${STEP_BODY}`}>
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
            </section>

            {/* 2. Resume */}
            <section className={`relative ${STEP_SECTION}`}>
              <h2 className={`${TYPE_STEP} flex items-center gap-2.5 min-w-0`}>
                <span className="w-1.5 h-5 bg-violet-500 rounded-full shrink-0" />
                <span className="truncate">{t.resume}</span>
              </h2>
              <div className="relative min-w-0 py-1">
                <button
                  type="button"
                  onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                  className={TYPE_PILL}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t.resumeLibrary}</span>
                  {resumeHistory.length > 0 && <span>({resumeHistory.length})</span>}
                </button>
                {showHistoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowHistoryDropdown(false)} />
                    <div className="absolute left-0 top-full mt-2 w-full max-w-sm bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-20 animate-fade-in overflow-hidden">
                      <div className={`p-3 bg-slate-900/80 border-b border-slate-700 ${TYPE_META} font-semibold uppercase tracking-widest`}>
                        {t.recentlyUploaded}
                      </div>
                      {resumeHistory.length === 0 ? (
                        <div className={`p-6 text-center ${TYPE_BODY}`}>
                          <p>{t.noResume}</p>
                        </div>
                      ) : (
                        resumeHistory.map((historyItem) => (
                          <div key={historyItem.id} onClick={() => handleSelectResume(historyItem)} className="p-3.5 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 group relative flex items-start transition-all">
                            <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 mr-2" />
                            <div className="flex-1 overflow-hidden text-left min-w-0">
                              <p className={`${TYPE_BODY_STRONG} truncate`}>{historyItem.fileName}</p>
                              <p className={`${TYPE_META} flex items-center mt-1.5`}><Clock className="w-3.5 h-3.5 mr-1 shrink-0" />{formatDateTime(historyItem.timestamp)}</p>
                            </div>
                            <button type="button" onClick={(e) => handleDeleteResume(e, historyItem.id)} className="p-1.5 text-zinc-500 hover:text-red-400 rounded"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className={STEP_BODY}>
                {!resume ? (
                  <div className="relative flex min-h-0 w-full flex-1 flex-col rounded-xl border-2 border-dashed border-slate-600 bg-slate-900/30">
                    <label
                      htmlFor="resume-file-input"
                      className="group flex h-full min-h-[11rem] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl px-4 py-8 hover:bg-slate-700/30"
                    >
                      <div className="p-3 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 transition-colors border border-slate-700 group-hover:border-indigo-500/30">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400" />
                      </div>
                      <div className="text-center min-w-0 space-y-1.5">
                        <p className={TYPE_BODY_STRONG}>{t.upload}</p>
                        <p className={TYPE_META}>{t.uploadSupport}</p>
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
                  <div className="flex min-h-[11rem] w-full min-w-0 flex-1 animate-fade-in flex-col justify-center gap-3 rounded-xl border border-indigo-500/50 bg-indigo-900/20 p-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="bg-indigo-500 p-1.5 rounded-lg shrink-0"><FileText className="w-4 h-4 text-white" /></div>
                      <div className="min-w-0 text-left space-y-1">
                        <p className={`${TYPE_BODY_STRONG} truncate`}>{resume.fileName}</p>
                        <p className={TYPE_META}>Ready for Analysis</p>
                      </div>
                      <button type="button" onClick={clearFile} className="p-1.5 hover:bg-white/10 rounded-full text-zinc-400 ml-auto shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualSave}
                      disabled={isSaving}
                      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                        isSaving
                          ? 'bg-emerald-500/5 text-emerald-400/50 border-emerald-500/10'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      <Save className="w-3.5 h-3.5" />
                      {isSaving ? t.saving : t.save}
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Report type */}
            <section className={STEP_SECTION}>
              <h2 className={`${TYPE_STEP} flex items-center gap-2.5 min-w-0`}>
                <span className="w-1.5 h-5 bg-emerald-500 rounded-full shrink-0" />
                <span className="truncate">{t.reportTypeStep}</span>
              </h2>
              {onReportTypeChange ? (
                <Link
                  href="/account"
                  className={`${TYPE_PILL} w-fit`}
                  title={creditsPillTitle}
                >
                  <CreditCard className="w-4 h-4 shrink-0" />
                  <span className="leading-relaxed truncate">{creditsPillLabel}</span>
                </Link>
              ) : null}
              {onReportTypeChange ? (
                <div className={`${STEP_BODY} gap-4`}>
                  <div className="grid min-h-0 flex-1 grid-rows-2 gap-4">
                    <div
                      className={`flex min-h-0 w-full flex-col justify-center gap-2 rounded-xl border-2 px-4 py-4 text-left transition ${
                        reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
                          ? 'border-solid border-violet-500 bg-violet-500/10'
                          : 'border-dashed border-slate-600 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onReportTypeChange(REPORT_CODES.JOB_FIT_SNAPSHOT)}
                        className="text-left w-full min-w-0 space-y-1.5"
                      >
                        <p className={TYPE_CARD}>Job Fit Snapshot</p>
                        <p className={TYPE_BODY}>{t.snapshotBlurb}</p>
                      </button>
                      <Link
                        href={`/samples?type=${REPORT_CODES.JOB_FIT_SNAPSHOT}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={SAMPLE_LINK_BTN}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View sample →
                      </Link>
                    </div>
                    <div
                      className={`flex min-h-0 w-full flex-col justify-center gap-2 rounded-xl border-2 px-4 py-4 text-left transition ${
                        reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
                          ? 'border-solid border-violet-500 bg-violet-500/10'
                          : 'border-dashed border-slate-600 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onReportTypeChange(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}
                        className="text-left w-full min-w-0 space-y-1.5"
                      >
                        <p className={TYPE_CARD}>Interview Strategy Guide</p>
                        <p className={TYPE_BODY}>{t.strategyBlurb}</p>
                      </button>
                      <Link
                        href={`/samples?type=${REPORT_CODES.INTERVIEW_STRATEGY_GUIDE}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={SAMPLE_LINK_BTN}
                        onClick={(e) => e.stopPropagation()}
                      >
                        View sample →
                      </Link>
                    </div>
                  </div>
                  {!compactChrome && (
                    <div className="shrink-0 pt-1">
                      <ReportCompareModal language={currentLanguage} variant="panel" />
                    </div>
                  )}
                </div>
              ) : (
                <div className={`${STEP_BODY} ${TYPE_META}`}>—</div>
              )}
            </section>

            {/* 4. Launch */}
            <section className="flex h-full min-h-0 flex-col gap-4 p-6 min-w-0 max-w-full bg-slate-900/50">
              <button
                type="submit"
                disabled={submitDisabled}
                className={`${TYPE_LAUNCH} ${
                  submitDisabled
                    ? 'bg-indigo-600/35 text-white/55 cursor-not-allowed shadow-none'
                    : publicAts
                      ? 'bg-emerald-600 hover:bg-emerald-500 hover:-translate-y-1 active:bg-emerald-700 active:translate-y-0 shadow-emerald-500/30'
                      : jdError
                        ? 'bg-red-600 hover:bg-red-500 hover:-translate-y-1 active:bg-red-700 active:translate-y-0 shadow-red-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 hover:-translate-y-1 active:bg-indigo-700 active:translate-y-0'
                }`}
              >
                {isLoading || isParsingUrl ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-zinc-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className={`animate-pulse ${TYPE_META}`}>
                      {isParsingUrl
                        ? (zh ? '解析中…' : 'Parsing…')
                        : t.generating}
                    </span>
                  </>
                ) : isSaving ? (
                  <span className={TYPE_META}>{t.waitingSave}</span>
                ) : (
                  <>
                    <span className="px-1">{submitLabel}</span>
                    <ArrowRight className="w-5 h-5 shrink-0" />
                  </>
                )}
              </button>
            </section>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InputForm;
