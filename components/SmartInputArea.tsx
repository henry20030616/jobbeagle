'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, FileText, Globe, Loader2, Puzzle } from 'lucide-react';
import {
  classifyJobInput,
  type JobInputClassification,
} from '@/lib/url-parser-logic';
import ErrorStateUI from '@/components/ErrorStateUI';

export interface SmartInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  error?: string | null;
  onBlurValidate?: () => void;
  disabled?: boolean;
  /** Shown while public ATS URL is being fetched */
  parsing?: boolean;
}

const PLACEHOLDER_ZH =
  '貼上完整的職缺描述 (JD)，或直接貼上 Greenhouse / Lever 職缺網址，立即獲得 AI 獵頭分析...';
const PLACEHOLDER_EN =
  'Paste the full job description (JD), or a Greenhouse / Lever job URL for instant AI triage...';

/**
 * Progressive job-input surface: plain JD, public ATS URL, or blocked-board URL.
 */
export default function SmartInputArea({
  value,
  onChange,
  language = 'en',
  error = null,
  onBlurValidate,
  disabled = false,
  parsing = false,
}: SmartInputAreaProps) {
  const zh = language === 'zh-TW' || language === 'zh-CN';
  const classification: JobInputClassification = useMemo(
    () => classifyJobInput(value),
    [value],
  );

  const borderClass =
    classification.kind === 'blocked_board'
      ? 'border-amber-500/50 focus:ring-amber-500/40'
      : classification.kind === 'public_ats'
        ? 'border-emerald-500/50 focus:ring-emerald-500/40'
        : classification.kind === 'other_url'
          ? 'border-blue-500/40 focus:ring-blue-500/30'
          : 'border-slate-600 focus:ring-indigo-500/40';

  return (
    <div className="space-y-0">
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center text-base font-medium text-slate-300">
            {classification.kind === 'public_ats' ? (
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
            ) : classification.kind === 'blocked_board' ||
              classification.kind === 'other_url' ? (
              <Globe className="w-5 h-5 mr-2 text-blue-400" />
            ) : (
              <FileText className="w-5 h-5 mr-2 text-indigo-400" />
            )}
            <span>{zh ? '職缺內容' : 'Job posting'}</span>
          </div>

          {classification.kind === 'public_ats' && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-full px-2.5 py-1 transition-all">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {classification.boardLabel} URL
            </span>
          )}
        </div>

        {/* Persistent light hint — hidden when blocked-board ErrorStateUI takes over */}
        {classification.kind !== 'blocked_board' && (
          <p className="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-slate-400">
            <Puzzle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              {zh
                ? 'LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs 職缺頁？用外掛一鍵抓取更方便。'
                : 'On LinkedIn, Indeed, ZipRecruiter, Glassdoor, or GovernmentJobs? Capture in one click with the extension.'}
            </span>
            <Link
              href="/extension"
              className="font-semibold text-indigo-300 hover:text-indigo-200 underline underline-offset-2 decoration-indigo-500/40 hover:decoration-indigo-300 transition-colors"
            >
              {zh ? '獲取官方外掛 →' : 'Get the extension →'}
            </Link>
          </p>
        )}

        <textarea
          required
          disabled={disabled || parsing}
          className={`w-full min-h-[200px] bg-slate-900/30 border-2 border-dashed rounded-xl p-5 text-base text-slate-200 placeholder-slate-500 focus:ring-2 focus:border-solid transition-all resize-y disabled:opacity-60 ${borderClass}`}
          placeholder={zh ? PLACEHOLDER_ZH : PLACEHOLDER_EN}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlurValidate}
        />

        {parsing && (
          <div className="absolute inset-0 top-10 flex items-center justify-center rounded-xl bg-slate-950/50 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
              <Loader2 className="w-5 h-5 animate-spin" />
              {zh ? '正在解析公開職缺頁…' : 'Fetching public job page…'}
            </div>
          </div>
        )}
      </div>

      <div
        className={`transition-all duration-300 ease-out ${
          classification.kind === 'blocked_board'
            ? 'max-h-[480px] opacity-100'
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {classification.kind === 'blocked_board' && (
          <ErrorStateUI
            boardLabel={classification.boardLabel}
            language={language}
            extensionHref="/extension"
          />
        )}
      </div>

      {classification.kind === 'other_url' && (
        <p className="mt-3 text-sm text-blue-200/90 bg-blue-950/40 border border-blue-500/30 rounded-lg px-3 py-2.5 transition-all">
          {zh
            ? '偵測到一般網址。目前僅支援自動解析 Greenhouse / Lever；LinkedIn 等請用外掛或貼完整 JD 文字。'
            : 'URL detected. Auto-fetch supports Greenhouse / Lever only. For LinkedIn and similar boards, use the extension or paste the full JD text.'}
        </p>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-sm text-red-300 animate-fade-in">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export { classifyJobInput };
