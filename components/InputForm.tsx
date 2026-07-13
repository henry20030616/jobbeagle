'use client';

import React, { useState, useRef, useEffect } from 'react';
import { UserInputs, ResumeInput, InterviewReport, ReportType, UserProfile } from '@/types';
import { FileText, Upload, X, Sparkles, History, Clock, ArrowRight, Save, ChevronDown, ChevronRight, ScanSearch, BadgeDollarSign, ChartNoAxesCombined, BrainCircuit, Puzzle, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import { validateJobDescription } from '@/lib/validate-job-description';
import { classifyJobInput } from '@/lib/url-parser-logic';
import SmartInputArea from '@/components/SmartInputArea';
import BrandLogo from '@/components/BrandLogo';
import type { AppLanguage } from '@/lib/language-context';
import { RESUME_LIBRARY_LIMIT } from '@/constants/resumes';
import { REPORT_CODES, reportShortLabel } from '@/constants/report-products';

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
    'zh-TW': { title: 'Jobbeagle', subtitle: '職位分析米格魯', description: '專家級 AI 職缺戰略分析：結合求職專家與獵頭視角，深度解析 JD 背後的組織需求與市場格局，助您掌握應對策略。', jobDescription: '職缺描述 (JD)', upload: '點擊上傳 PDF 或文字檔', save: '儲存', saving: '儲存中...', saved: '✓ 已儲存!', saveFailed: '儲存失敗，請重試', generate: '啟動AI戰略分析', resumeLibrary: '已存履歷', recentReports: '近期分析報告', noResume: '尚未儲存任何履歷', recentlyUploaded: '最近上傳的履歷', engineIntro: '戰略引擎簡介', engineDescription: 'Jobbeagle 搭載頂級人資與求職專家分析邏輯，深度解析 JD 背後的組織需求與市場格局。', reportOutput: '深度報告產出項', matchAnalysis: '人才職位匹配分析', matchAnalysisDesc: '揭示職位隱藏門檻，精準評估您的核心優勢與缺口。', salaryResearch: '真實面試題與薪酬範圍', salaryResearchDesc: '提供真實面試考古題、市場薪酬範圍及談判策略。', industryAnalysis: '產業格局與競爭者分析', industryAnalysisDesc: '從求職專家視角解析公司的市場護城河與未來風險。', interviewPrep: '高階面試模擬與對策', interviewPrepDesc: '網羅真實考題並提供具備深度邏輯的 STAR 回答引導。', jobData: '1. 職缺資訊', jobStepHint: '貼上完整職缺內容，或使用 Chrome 外掛。', jdFullTextHint: '請貼上公司名稱、職缺名稱，以及完整職缺內文（含條件與職責）；勿只貼職責段落或網址。', inputJobUrl: '職缺內容', jobUrlPlaceholder: '請貼上：公司名稱、職缺名稱，以及完整職缺內文（條件、職責等）。勿只貼職責段落或網址…', urlTip: '偵測到網址：請改為到職缺頁手動複製完整內容後貼上。', resume: '2. 我的履歷', reportTypeStep: '3. 選擇報告類型', snapshotBlurb: '無聯網 · 匹配分數 · 薪酬定位', strategyBlurb: '含完整 Snapshot · 即時情報 · STAR · 談判', uploadSupport: '支援 .pdf, .doc, .docx, .txt, .md (Max 4MB)', waitingSave: '請等待儲存完成...', generating: '生成深度戰略報告...', fileTooLarge: '檔案大小超過 4MB，請上傳較小的檔案。' },
    'zh-CN': { title: 'Jobbeagle', subtitle: '职位分析猎犬', description: '专家级 AI 职位战略分析：结合求职专家与猎头视角，深度解析 JD 背后的组织需求与市场格局，助您掌握应对策略。', jobDescription: '职位描述 (JD)', upload: '点击上传 PDF 或文本文件', save: '保存', saving: '保存中...', saved: '✓ 已保存!', saveFailed: '保存失败，请重试', generate: '启动AI战略分析', resumeLibrary: '已存简历', recentReports: '近期分析报告', noResume: '尚未保存任何简历', recentlyUploaded: '最近上传的简历', engineIntro: '战略引擎简介', engineDescription: 'Jobbeagle 搭载顶级人资与求职专家分析逻辑，深度解析 JD 背后的组织需求与市场格局。', reportOutput: '深度报告产出项', matchAnalysis: '人才职位匹配分析', matchAnalysisDesc: '揭示职位隐藏门槛，精准评估您的核心优势与缺口。', salaryResearch: '真实面试题与薪酬范围', salaryResearchDesc: '提供真实面试考古题、市场薪酬范围及谈判策略。', industryAnalysis: '产业格局与竞争者分析', industryAnalysisDesc: '从求职专家视角解析公司的市场护城河与未来风险。', interviewPrep: '高阶面试模拟与对策', interviewPrepDesc: '网罗真实考题并提供具备深度逻辑的 STAR 回答引导。', jobData: '1. 职位信息', jobStepHint: '粘贴完整职位内容，或使用 Chrome 扩展。', jdFullTextHint: '请粘贴公司名称、职位名称，以及完整职位正文（含条件与职责）；勿只贴职责段落或网址。', inputJobUrl: '职位内容', jobUrlPlaceholder: '请粘贴：公司名称、职位名称，以及完整职位正文（条件、职责等）。勿只贴职责段落或网址…', urlTip: '检测到网址：请改为到职位页手动复制完整内容后粘贴。', resume: '2. 我的简历', reportTypeStep: '3. 选择报告类型', snapshotBlurb: '无联网 · 匹配分数 · 薪酬定位', strategyBlurb: '含完整 Snapshot · 即时情报 · STAR · 谈判', uploadSupport: '支持 .pdf, .doc, .docx, .txt, .md (最大 4MB)', waitingSave: '请等待保存完成...', generating: '生成深度战略报告...', fileTooLarge: '文件大小超过 4MB，请上传较小的文件。' },
    en: { title: 'Jobbeagle', subtitle: '(Job Analysis Beagle)', description: 'Expert-level AI Job Strategy Analysis: career-expert and headhunter logic that reads organizational needs and market dynamics behind every JD—so you master response strategies.', jobDescription: 'Job Description (JD)', upload: 'Click to upload PDF or text file', save: 'Save', saving: 'Saving...', saved: '✓ Saved!', saveFailed: 'Save failed, please try again', generate: 'Launch AI Strategy Analysis', resumeLibrary: 'Saved Resumes', recentReports: 'Recent Analysis Reports', noResume: 'No resumes saved yet', recentlyUploaded: 'Recently uploaded resumes', engineIntro: 'Strategic Engine Introduction', engineDescription: 'Jobbeagle is equipped with top-tier HR and career expert analysis logic, deeply analyzing organizational needs and market dynamics behind JDs.', reportOutput: 'In-Depth Report Outputs', matchAnalysis: 'Talent-Position Match Analysis', matchAnalysisDesc: 'Reveal hidden job thresholds and accurately assess your core strengths and gaps.', salaryResearch: 'Real Interview Questions & Salary Range', salaryResearchDesc: 'Provide real interview questions, market salary ranges, and negotiation strategies.', industryAnalysis: 'Industry Landscape & Competitor Analysis', industryAnalysisDesc: 'Analyze company market moats and future risks from a career expert perspective.', interviewPrep: 'Advanced Interview Simulation & Strategy', interviewPrepDesc: 'Gather real interview questions and provide in-depth STAR answer guidance.', jobData: '1. Job Information', jobStepHint: 'Paste the full job posting, or use the Chrome extension.', jdFullTextHint: 'Include company name, job title, and the full description (requirements and responsibilities). Don’t paste only the body text or a URL.', inputJobUrl: 'Job posting', jobUrlPlaceholder: 'Paste company name, job title, and the full posting (requirements, responsibilities…). Don’t paste only the body text or a URL…', urlTip: 'URL detected: open the posting and paste the full copied text instead.', resume: '2. My Resume', reportTypeStep: '3. Report type', snapshotBlurb: 'No web search · Match score · Comp positioning', strategyBlurb: 'Includes Snapshot + live intel · STAR · Negotiation', uploadSupport: 'Supports .pdf, .doc, .docx, .txt, .md (Max 4MB)', waitingSave: 'Please wait for save to complete...', generating: 'Generating in-depth strategic report...', fileTooLarge: 'File size exceeds 4MB, please upload a smaller file.' },
    es: { title: 'Jobbeagle', subtitle: '(Beagle de Análisis de Empleo)', description: 'Análisis de estrategia laboral con IA: lógica de expertos y headhunters que lee las necesidades organizacionales y la dinámica de mercado detrás de cada JD.', jobDescription: 'Descripción del Puesto (JD)', upload: 'Haz clic para subir PDF o archivo de texto', save: 'Guardar', saving: 'Guardando...', saved: '✓ Guardado!', saveFailed: 'Error al guardar, inténtalo de nuevo', generate: 'Iniciar Análisis de Estrategia IA', resumeLibrary: 'CVs guardados', recentReports: 'Informes de Análisis Recientes', noResume: 'No hay CV guardados aún', recentlyUploaded: 'CV subidos recientemente', engineIntro: 'Introducción al Motor Estratégico', engineDescription: 'Jobbeagle está equipado con lógica de análisis de RR.HH. y expertos en carrera de primer nivel, analizando en profundidad las necesidades organizacionales detrás de los JD.', reportOutput: 'Resultados del Informe en Profundidad', matchAnalysis: 'Análisis de Coincidencia Candidato-Posición', matchAnalysisDesc: 'Revela los umbrales ocultos del puesto y evalúa con precisión tus fortalezas y brechas.', salaryResearch: 'Preguntas de Entrevista Reales y Rango Salarial', salaryResearchDesc: 'Proporciona preguntas de entrevista reales, rangos salariales del mercado y estrategias de negociación.', industryAnalysis: 'Panorama Industrial y Análisis de Competidores', industryAnalysisDesc: 'Analiza las ventajas competitivas y los riesgos futuros de la empresa desde la perspectiva de un experto.', interviewPrep: 'Simulación de Entrevista Avanzada y Estrategia', interviewPrepDesc: 'Recopila preguntas reales de entrevista y proporciona guías de respuesta STAR detalladas.', jobData: '1. Información del Puesto', jobStepHint: 'Pega la oferta completa, o usa la extensión de Chrome.', jdFullTextHint: 'Incluye nombre de la empresa, puesto y la descripción completa (requisitos y responsabilidades). No pegues solo el cuerpo o una URL.', inputJobUrl: 'Oferta de trabajo', jobUrlPlaceholder: 'Pega empresa, puesto y la oferta completa (requisitos, responsabilidades…). No pegues solo el cuerpo o una URL…', urlTip: 'URL detectada: abre la oferta y pega el texto completo copiado.', resume: '2. Mi CV', reportTypeStep: '3. Tipo de informe', snapshotBlurb: 'Sin web · Puntuación · Compensación', strategyBlurb: 'Incluye Snapshot + intel · STAR · Negociación', uploadSupport: 'Compatible con .pdf, .doc, .docx, .txt, .md (Máx 4MB)', waitingSave: 'Espera a que se complete el guardado...', generating: 'Generando informe estratégico en profundidad...', fileTooLarge: 'El tamaño del archivo supera los 4MB, por favor sube un archivo más pequeño.' },
    hi: { title: 'Jobbeagle', subtitle: '(जॉब विश्लेषण बीगल)', description: 'विशेषज्ञ-स्तरीय AI नौकरी रणनीति विश्लेषण केंद्र: करियर विशेषज्ञ विश्लेषण और हेडहंटर दृष्टिकोण को मिलाकर आपकी प्रतिक्रिया रणनीतियों में मदद करता है।', jobDescription: 'नौकरी विवरण (JD)', upload: 'PDF या टेक्स्ट फ़ाइल अपलोड करने के लिए क्लिक करें', save: 'सहेजें', saving: 'सहेजा जा रहा है...', saved: '✓ सहेजा गया!', saveFailed: 'सहेजने में विफल, पुनः प्रयास करें', generate: 'AI रणनीति विश्लेषण शुरू करें', resumeLibrary: 'सहेजे गए CV', recentReports: 'हाल के विश्लेषण रिपोर्ट', noResume: 'अभी तक कोई CV नहीं सहेजा गया', recentlyUploaded: 'हाल ही में अपलोड किए गए CV', engineIntro: 'रणनीतिक इंजन परिचय', engineDescription: 'Jobbeagle शीर्ष-स्तरीय HR और करियर विशेषज्ञ विश्लेषण तर्क से लैस है, JD के पीछे संगठनात्मक जरूरतों का गहन विश्लेषण करता है।', reportOutput: 'गहन रिपोर्ट आउटपुट', matchAnalysis: 'प्रतिभा-पद मिलान विश्लेषण', matchAnalysisDesc: 'नौकरी की छिपी आवश्यकताओं को उजागर करें और अपनी मुख्य शक्तियों का सटीक मूल्यांकन करें।', salaryResearch: 'वास्तविक साक्षात्कार प्रश्न और वेतन सीमा', salaryResearchDesc: 'वास्तविक साक्षात्कार प्रश्न, बाजार वेतन सीमाएं और बातचीत रणनीतियां प्रदान करता है।', industryAnalysis: 'उद्योग परिदृश्य और प्रतिस्पर्धी विश्लेषण', industryAnalysisDesc: 'करियर विशेषज्ञ के दृष्टिकोण से कंपनी के बाजार फायदे और भविष्य के जोखिमों का विश्लेषण करें।', interviewPrep: 'उन्नत साक्षात्कार सिमुलेशन और रणनीति', interviewPrepDesc: 'वास्तविक साक्षात्कार प्रश्न एकत्र करें और गहन STAR उत्तर मार्गदर्शन प्रदान करें।', jobData: '1. नौकरी की जानकारी', jobStepHint: 'पूरी जॉब पोस्टिंग पेस्ट करें, या Chrome एक्सटेंशन उपयोग करें।', jdFullTextHint: 'कंपनी नाम, पदनाम, और पूरा विवरण (आवश्यकताएँ व जिम्मेदारियाँ) शामिल करें। केवल बॉडी टेक्स्ट या URL न पेस्ट करें।', inputJobUrl: 'नौकरी पोस्टिंग', jobUrlPlaceholder: 'कंपनी नाम, पदनाम, और पूरी पोस्टिंग पेस्ट करें (आवश्यकताएँ, जिम्मेदारियाँ…)। केवल बॉडी या URL न पेस्ट करें…', urlTip: 'URL पाया गया: पोस्टिंग खोलें और पूरा कॉपी किया हुआ टेक्स्ट पेस्ट करें।', resume: '2. मेरा CV', reportTypeStep: '3. रिपोर्ट प्रकार', snapshotBlurb: 'बिना वेब · मैच स्कोर · मुआवजा', strategyBlurb: 'Snapshot + लाइव intel · STAR · बातचीत', uploadSupport: '.pdf, .doc, .docx, .txt, .md सपोर्ट करता है (अधिकतम 4MB)', waitingSave: 'कृपया सेव पूरा होने तक प्रतीक्षा करें...', generating: 'गहन रणनीतिक रिपोर्ट तैयार की जा रही है...', fileTooLarge: 'फ़ाइल का आकार 4MB से अधिक है, कृपया छोटी फ़ाइल अपलोड करें।' },
    ar: { title: 'Jobbeagle', subtitle: '(بيغل تحليل الوظائف)', description: 'مركز تحليل استراتيجية الوظائف بالذكاء الاصطناعي: يجمع بين تحليل خبراء المسار المهني ومنظور مسؤولي التوظيف لمساعدتك على إتقان استراتيجية التقديم.', jobDescription: 'وصف الوظيفة (JD)', upload: 'انقر لرفع ملف PDF أو ملف نصي', save: 'حفظ', saving: 'جارٍ الحفظ...', saved: '✓ تم الحفظ!', saveFailed: 'فشل الحفظ، يرجى المحاولة مرة أخرى', generate: 'بدء تحليل استراتيجية الذكاء الاصطناعي', resumeLibrary: 'السير المحفوظة', recentReports: 'تقارير التحليل الأخيرة', noResume: 'لا توجد سير ذاتية محفوظة بعد', recentlyUploaded: 'السير الذاتية المرفوعة مؤخرًا', engineIntro: 'مقدمة محرك الاستراتيجية', engineDescription: 'يعتمد Jobbeagle على منطق تحليل متخصص في الموارد البشرية والمسار المهني لفهم احتياجات المنظمة والسوق خلف وصف الوظيفة بعمق.', reportOutput: 'مخرجات التقرير المتعمق', matchAnalysis: 'تحليل توافق المرشح مع الوظيفة', matchAnalysisDesc: 'يكشف المتطلبات الخفية للوظيفة ويقيّم نقاط قوتك والفجوات بدقة.', salaryResearch: 'أسئلة مقابلة حقيقية ونطاق الراتب', salaryResearchDesc: 'يوفر أسئلة مقابلة حقيقية ونطاقات رواتب السوق واستراتيجيات التفاوض.', industryAnalysis: 'تحليل القطاع والمنافسين', industryAnalysisDesc: 'يحلل مزايا الشركة التنافسية ومخاطرها المستقبلية من منظور خبير مهني.', interviewPrep: 'محاكاة مقابلة متقدمة واستراتيجية', interviewPrepDesc: 'يجمع أسئلة مقابلة واقعية ويقدم إرشادات STAR عميقة للإجابة.', jobData: '1. معلومات الوظيفة', jobStepHint: 'الصق إعلان الوظيفة بالكامل، أو استخدم إضافة Chrome.', jdFullTextHint: 'أدرج اسم الشركة والمسمى الوظيفي والوصف الكامل (المتطلبات والمسؤوليات). لا تلصق نص المتطلبات فقط أو رابطًا.', inputJobUrl: 'إعلان الوظيفة', jobUrlPlaceholder: 'الصق اسم الشركة والمسمى والوصف الكامل (المتطلبات والمسؤوليات…). لا تلصق النص فقط أو رابطًا…', urlTip: 'تم اكتشاف رابط: افتح الإعلان والصق النص الكامل المنسوخ بدلًا منه.', resume: '2. سيرتي الذاتية', reportTypeStep: '3. نوع التقرير', snapshotBlurb: 'بدون بحث ويب · درجة التوافق · التعويض', strategyBlurb: 'يشمل Snapshot + معلومات حية · STAR · تفاوض', uploadSupport: 'يدعم .pdf و .doc و .docx و .txt و .md (حتى 4MB)', waitingSave: 'يرجى الانتظار حتى يكتمل الحفظ...', generating: 'جارٍ إنشاء التقرير الاستراتيجي المتعمق...', fileTooLarge: 'حجم الملف يتجاوز 4MB، يرجى رفع ملف أصغر.' },
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
    return `${snap} (${snapshotCredits}) · ${strat} (${strategyCredits}) →`;
  })();
  const creditsPillTitle = zh
    ? '剩餘額度：匹配快照 / 面試策略（點此加購或管理帳戶）'
    : 'Remaining credits: Snapshot / Strategy Guide (buy more or manage account)';

  return (
    <div className="flex flex-col gap-10">
      <div className="text-center space-y-3 py-4">
        <BrandLogo size="hero" as="h1" className="justify-center" />
        <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed">
          {t.description}
        </p>

      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl backdrop-blur-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-500">
              <Sparkles className="w-64 h-64 text-indigo-500" />
           </div>

           <div className="relative">
               <div className="grid grid-cols-1 lg:grid-cols-4 lg:divide-x divide-slate-700/80">
                  {([
                    {
                      id: 'match',
                      icon: ScanSearch,
                      iconWrap: 'from-amber-500/25 to-amber-900/30 ring-amber-400/25',
                      iconColor: 'text-amber-300',
                      title: t.matchAnalysis,
                      desc: t.matchAnalysisDesc,
                    },
                    {
                      id: 'salary',
                      icon: BadgeDollarSign,
                      iconWrap: 'from-emerald-500/25 to-emerald-900/30 ring-emerald-400/25',
                      iconColor: 'text-emerald-300',
                      title: t.salaryResearch,
                      desc: t.salaryResearchDesc,
                    },
                    {
                      id: 'industry',
                      icon: ChartNoAxesCombined,
                      iconWrap: 'from-sky-500/25 to-sky-900/30 ring-sky-400/25',
                      iconColor: 'text-sky-300',
                      title: t.industryAnalysis,
                      desc: t.industryAnalysisDesc,
                    },
                    {
                      id: 'interview',
                      icon: BrainCircuit,
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
                        onClick={() => {
                          setExpandedFeature(open ? null : item.id);
                        }}
                        className="w-full text-left flex items-start gap-3 p-4 sm:p-5 hover:bg-slate-700/30 transition-colors border-b lg:border-b-0 border-slate-700/60 last:border-b-0"
                      >
                        <div
                          className={`shrink-0 rounded-xl p-3 bg-gradient-to-br ring-1 shadow-inner ${item.iconWrap}`}
                        >
                          <Icon className={`w-6 h-6 ${item.iconColor}`} strokeWidth={1.75} absoluteStrokeWidth />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-base font-bold text-slate-200 leading-snug">{item.title}</span>
                            <ChevronDown
                              className={`w-4 h-4 text-slate-500 shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                              aria-hidden
                            />
                          </div>
                          <div
                            className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                          >
                            <div className="overflow-hidden">
                              <p className="text-sm text-slate-400 leading-normal pt-1.5 pb-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
               </div>
           </div>
        </div>

        <div className="rounded-2xl border border-slate-500/70 bg-gradient-to-b from-slate-500/45 to-slate-600/70 shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:items-stretch">
            {/* 1. Job */}
            <div className="relative lg:col-span-4 p-5 sm:p-6 flex flex-col h-full min-w-0 min-h-0 border-b lg:border-b-0 lg:border-r border-slate-700/80">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center mb-1.5 min-h-[2.75rem] shrink-0">
                <span className="w-1.5 h-7 bg-indigo-500 rounded-full mr-3 shrink-0" />
                <span className="leading-snug">{t.jobData}</span>
              </h2>
              <div className="mb-3 min-h-[2.75rem] shrink-0 flex items-start">
                <p className="text-sm text-slate-400 leading-snug pl-[1.125rem]">
                  {t.jobStepHint}
                </p>
              </div>
              <div className="mb-3 min-h-[2.125rem] shrink-0 flex items-center">
                <Link
                  href="/extension"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20 transition-all whitespace-nowrap"
                  title={
                    currentLanguage === 'zh-TW' || currentLanguage === 'zh-CN'
                      ? '職缺頁可一鍵抓 JD，免手動貼上'
                      : 'On a job page? Grab the JD in one click — no paste'
                  }
                >
                  <Puzzle className="w-4 h-4 shrink-0" />
                  <span className="font-bold">
                    {currentLanguage === 'zh-TW' || currentLanguage === 'zh-CN'
                      ? 'Chrome 外掛一鍵抓職缺 →'
                      : 'Grab JD with Chrome extension →'}
                  </span>
                </Link>
              </div>
              <div className="flex-1 flex flex-col min-h-[220px]">
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
              <div
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-600 text-slate-300 shadow-md"
                aria-hidden
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <div className="lg:hidden flex justify-center pt-3 -mb-1 text-slate-500" aria-hidden>
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Resume */}
            <div className="relative lg:col-span-3 p-5 sm:p-6 flex flex-col h-full min-w-0 min-h-0 border-b lg:border-b-0 lg:border-r border-slate-700/80">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center mb-1.5 min-h-[2.75rem] shrink-0">
                <span className="w-1.5 h-7 bg-violet-500 rounded-full mr-3 shrink-0" />
                <span className="whitespace-nowrap">{t.resume}</span>
              </h2>
              <div className="mb-3 min-h-[2.75rem] shrink-0" aria-hidden />
              <div className="relative mb-3 min-h-[2.125rem] shrink-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                    className="flex items-center gap-1.5 text-sm text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20 transition-all whitespace-nowrap"
                  >
                    <History className="w-4 h-4" />
                    <span className="font-bold">{t.resumeLibrary}</span>
                    {resumeHistory.length > 0 && <span className="font-bold">({resumeHistory.length})</span>}
                  </button>
                  {showHistoryDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowHistoryDropdown(false)} />
                      <div className="absolute left-0 top-9 w-80 max-w-[calc(100vw-2rem)] bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-20 animate-fade-in overflow-hidden">
                        <div className="p-3 bg-slate-900/80 border-b border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {t.recentlyUploaded}
                        </div>
                        {resumeHistory.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-sm">
                            <p>{t.noResume}</p>
                          </div>
                        ) : (
                          resumeHistory.map((historyItem) => (
                            <div key={historyItem.id} onClick={() => handleSelectResume(historyItem)} className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 group relative flex items-start transition-all">
                              <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 mr-2" />
                              <div className="flex-1 overflow-hidden text-left">
                                <p className="text-sm text-slate-200 font-bold truncate">{historyItem.fileName}</p>
                                <p className="text-xs text-slate-500 flex items-center mt-1"><Clock className="w-3.5 h-3.5 mr-1" />{formatDateTime(historyItem.timestamp)}</p>
                              </div>
                              <button type="button" onClick={(e) => handleDeleteResume(e, historyItem.id)} className="p-1.5 text-slate-600 hover:text-red-400 rounded"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
              </div>

              <div className="flex-1 flex flex-col min-h-[220px]">
                {!resume ? (
                  <div className="w-full flex-1 h-full border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center bg-slate-900/30 transition-all relative">
                    <label
                      htmlFor="resume-file-input"
                      className="flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-700/30 w-full h-full px-3 py-4 rounded-xl group relative z-10"
                    >
                      <div className="p-2.5 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 transition-colors border border-slate-700 group-hover:border-indigo-500/30">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-indigo-400" />
                      </div>
                      <div className="text-center min-w-0">
                        <p className="text-base text-slate-300 font-bold">{t.upload}</p>
                        <p className="text-xs text-slate-500 mt-1 font-medium leading-snug">{t.uploadSupport}</p>
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
                  <div className="w-full flex-1 h-full bg-indigo-900/20 border border-indigo-500/50 rounded-xl flex flex-col justify-center gap-2 p-3 animate-fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="bg-indigo-500 p-1.5 rounded-lg shrink-0"><FileText className="w-4 h-4 text-white" /></div>
                      <div className="min-w-0 text-left">
                        <p className="text-base font-bold text-white truncate">{resume.fileName}</p>
                        <p className="text-xs text-indigo-300">Ready for Analysis</p>
                      </div>
                      <button type="button" onClick={clearFile} className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 ml-auto shrink-0"><X className="w-4 h-4" /></button>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualSave}
                      disabled={isSaving}
                      className={`inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
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
              <div
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-600 text-slate-300 shadow-md"
                aria-hidden
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <div className="lg:hidden flex justify-center pt-3 -mb-1 text-slate-500" aria-hidden>
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>

            {/* 3. Report type */}
            <div className="relative lg:col-span-3 p-5 sm:p-6 flex flex-col h-full min-w-0 min-h-0 border-b lg:border-b-0 lg:border-r border-slate-700/80">
              {onReportTypeChange ? (
                <div className="flex flex-col flex-1 min-h-0">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center mb-1.5 min-h-[2.75rem] shrink-0">
                    <span className="w-1.5 h-7 bg-emerald-500 rounded-full mr-3 shrink-0" />
                    <span className="leading-snug">{t.reportTypeStep}</span>
                  </h2>
                  <div className="mb-3 min-h-[2.75rem] shrink-0" aria-hidden />
                  <div className="mb-3 min-h-[2.125rem] shrink-0 flex items-center">
                    <Link
                      href="/account"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20 transition-all max-w-full"
                      title={creditsPillTitle}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span className="font-bold leading-snug">{creditsPillLabel}</span>
                    </Link>
                  </div>
                  <div className="grid grid-rows-2 gap-2.5 flex-1 min-h-[220px]">
                    <button
                      type="button"
                      onClick={() => onReportTypeChange(REPORT_CODES.JOB_FIT_SNAPSHOT)}
                      className={`w-full h-full min-h-0 rounded-xl border-2 px-3.5 py-3.5 text-left transition flex flex-col justify-center ${
                        reportType === REPORT_CODES.JOB_FIT_SNAPSHOT
                          ? 'border-solid border-violet-500 bg-violet-500/10'
                          : 'border-dashed border-slate-600 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50'
                      }`}
                    >
                      <p className="font-semibold text-white text-base">Job Fit Snapshot</p>
                      <p className="text-sm text-slate-400 mt-1.5 leading-snug">{t.snapshotBlurb}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => onReportTypeChange(REPORT_CODES.INTERVIEW_STRATEGY_GUIDE)}
                      className={`w-full h-full min-h-0 rounded-xl border-2 px-3.5 py-3.5 text-left transition flex flex-col justify-center ${
                        reportType === REPORT_CODES.INTERVIEW_STRATEGY_GUIDE
                          ? 'border-solid border-violet-500 bg-violet-500/10'
                          : 'border-dashed border-slate-600 bg-slate-900/30 hover:border-slate-500 hover:bg-slate-900/50'
                      }`}
                    >
                      <p className="font-semibold text-white text-base">Interview Strategy Guide</p>
                      <p className="text-sm text-slate-400 mt-1.5 leading-snug">{t.strategyBlurb}</p>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">—</div>
              )}
              <div
                className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-600 text-slate-300 shadow-md"
                aria-hidden
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <div className="lg:hidden flex justify-center pt-3 -mb-1 text-slate-500" aria-hidden>
                <ChevronDown className="w-5 h-5" />
              </div>
            </div>

            {/* Launch */}
            <div className="lg:col-span-2 p-5 sm:p-6 flex flex-col h-full min-h-0 bg-slate-700/30">
              {(() => {
                const blocked = jobInputKind.kind === 'blocked_board';
                const publicAts = jobInputKind.kind === 'public_ats';
                const zh = currentLanguage === 'zh-TW' || currentLanguage === 'zh-CN';
                const submitLabel = publicAts
                  ? resume
                    ? zh
                      ? '立即解析並分析'
                      : 'Parse & analyze'
                    : zh
                      ? '解析網址'
                      : 'Parse URL'
                  : t.generate;
                const disabled =
                  isLoading ||
                  isParsingUrl ||
                  isSaving ||
                  !jobDescription ||
                  blocked ||
                  (!publicAts && !resume);
                return (
                  <button
                    type="submit"
                    disabled={disabled}
                    className={`w-full h-full min-h-[140px] lg:min-h-0 px-4 py-5 rounded-xl font-black text-base sm:text-lg text-white shadow-lg transition-all transform flex flex-col justify-center items-center gap-2.5 text-center ${
                      disabled
                        ? 'bg-slate-700 cursor-not-allowed text-slate-500'
                        : publicAts
                          ? 'bg-gradient-to-b from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 ring-1 ring-white/10'
                          : jdError
                            ? 'bg-gradient-to-b from-red-700 to-red-600 ring-1 ring-red-500/30'
                            : 'bg-gradient-to-b from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 ring-1 ring-white/10'
                    }`}
                  >
                    {isLoading || isParsingUrl ? (
                      <>
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="animate-pulse text-xs leading-snug">
                          {isParsingUrl
                            ? (zh ? '解析中…' : 'Parsing…')
                            : t.generating}
                        </span>
                      </>
                    ) : isSaving ? (
                      <span className="text-slate-500 text-xs">{t.waitingSave}</span>
                    ) : (
                      <>
                        <span className="leading-snug px-1">{submitLabel}</span>
                        <ArrowRight className="w-6 h-6 shrink-0" />
                      </>
                    )}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InputForm;
