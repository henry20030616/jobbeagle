'use client';

import React, { useMemo, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, Puzzle } from 'lucide-react';
import { classifyJobInput, type JobInputClassification } from '@/lib/url-parser-logic';
import ErrorStateUI from '@/components/ErrorStateUI';
import {
  jdCharProgress,
  jdEmptyHint,
  jdUrlOnlyMessage,
  MIN_JD_CHARS,
} from '@/lib/jd-paste-help';

export interface SmartInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  error?: string | null;
  onBlurValidate?: () => void;
  disabled?: boolean;
  /** Shown while public ATS URL is being fetched */
  parsing?: boolean;
  /** Tighter height for horizontal step layouts */
  compact?: boolean;
  /** When true, hide the extension CTA (parent renders a matching pill) */
  hideExtensionHint?: boolean;
  /** Overrides default empty-state placeholder */
  placeholder?: string;
}

const PLACEHOLDER_ZH =
  '請貼上完整職缺：公司名稱、職缺名稱，以及完整職缺內容（條件、職責等）。\n勿只貼網址或片段…';
const PLACEHOLDER_EN =
  'Paste the full job posting: company name, job title, and full description (requirements, responsibilities…).\nDo not paste only a URL or a short excerpt…';

/** Same type scale as InputForm “Click to upload Resume”. */
const JD_PROMPT_TYPE =
  'upload-prompt text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold leading-snug';

/** Desktop Step 1 paste prompt — 43px (2.6875rem), not upload-prompt 54px. */
const JD_PROMPT_TYPE_COMPACT = 'jd-paste-prompt text-sm font-semibold leading-snug';

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
  compact = false,
  hideExtensionHint = false,
  placeholder,
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const focusPaste = () => textareaRef.current?.focus();

  const resolvedPlaceholder = placeholder ?? (zh ? PLACEHOLDER_ZH : PLACEHOLDER_EN);
  const promptType = compact ? JD_PROMPT_TYPE_COMPACT : JD_PROMPT_TYPE;
  const trimmedLen = value.trim().length;
  const showCharProgress =
    classification.kind === 'plain' && trimmedLen > 0 && trimmedLen < MIN_JD_CHARS;

  return (
    <div className={`min-w-0 max-w-full ${compact ? 'flex h-full min-h-0 flex-1 flex-col gap-2' : 'space-y-0'}`}>
      <div className={`relative min-w-0 max-w-full ${compact ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
        {classification.kind === 'public_ats' && (
          <div className={`${compact ? 'mb-1.5' : 'mb-3'} flex justify-end`}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-full px-2.5 py-1 transition-all">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {classification.boardLabel} URL
            </span>
          </div>
        )}

        {/* Persistent light hint — hidden when blocked-board ErrorStateUI takes over */}
        {classification.kind !== 'blocked_board' && !hideExtensionHint && (
          compact ? (
            <div className="mb-3 min-h-[2.125rem] flex items-center">
              <Link
                href="/extension"
                className="inline-flex items-center gap-1.5 text-sm text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20 transition-all whitespace-nowrap"
              >
                <Puzzle className="w-4 h-4 shrink-0" />
                <span className="font-bold">
                  {zh ? 'Chrome 外掛一鍵抓職缺 →' : 'Grab JD with Chrome extension →'}
                </span>
              </Link>
            </div>
          ) : (
          <p className="mb-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-base text-slate-400">
            <Puzzle className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              {zh
                ? 'LinkedIn / Indeed / ZipRecruiter / Glassdoor / GovernmentJobs 職缺頁？用外掛一鍵抓取更方便。'
                : 'On LinkedIn, Indeed, ZipRecruiter, Glassdoor, or GovernmentJobs? Capture the JD in one click with the Chrome extension.'}
            </span>
            <Link
              href="/extension"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/20 transition-all whitespace-nowrap"
            >
              {zh ? 'Chrome 外掛一鍵抓職缺 →' : 'Grab JD with Chrome extension →'}
            </Link>
          </p>
          )
        )}

        <div className={`relative min-w-0 max-w-full ${compact ? 'flex min-h-0 flex-1 flex-col' : ''}`}>
          <textarea
            ref={textareaRef}
            disabled={disabled || parsing}
            className={`${promptType} w-full max-w-full min-w-0 ${compact ? 'min-h-0 flex-1' : 'min-h-[220px]'} bg-slate-900/30 border-2 border-dashed rounded-xl ${compact ? 'p-3' : 'p-5'} text-zinc-100 placeholder:opacity-0 focus:ring-2 focus:border-solid transition-all resize-y disabled:opacity-60 ${borderClass}`}
            placeholder={resolvedPlaceholder}
            aria-label={resolvedPlaceholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlurValidate}
          />
          {!value && (
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 flex items-start justify-start overflow-hidden rounded-xl ${compact ? 'px-3 py-3' : 'px-6 py-5'}`}
            >
              <p className={`${promptType} w-full min-w-0 max-w-full whitespace-pre-line text-left text-slate-400`}>
                {resolvedPlaceholder}
              </p>
            </div>
          )}

          {parsing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/50 backdrop-blur-[1px]">
              <div className={`${promptType} flex items-center gap-2 text-emerald-200`}>
                <Loader2 className="w-5 h-5 animate-spin" />
                {zh ? '正在解析公開職缺頁…' : 'Fetching public job page…'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-out ${
          classification.kind === 'blocked_board'
            ? 'max-h-[40rem] opacity-100'
            : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {classification.kind === 'blocked_board' && (
          <ErrorStateUI
            boardLabel={classification.boardLabel}
            language={language}
            extensionHref="/extension"
            onPasteHere={focusPaste}
          />
        )}
      </div>

      {!value.trim() && classification.kind !== 'blocked_board' && (
        <p className="mt-2 text-xs leading-snug text-slate-500">{jdEmptyHint(language)}</p>
      )}

      {showCharProgress && (
        <p className="mt-2 text-xs leading-snug text-amber-200/90">{jdCharProgress(language, trimmedLen)}</p>
      )}

      {classification.kind === 'other_url' && (
        <div className="upload-prompt mt-3 space-y-2 rounded-lg border border-blue-500/30 bg-blue-950/40 px-3 py-2.5 text-sm text-blue-200/90 transition-all lg:text-lg xl:text-2xl 2xl:text-3xl">
          <p>{jdUrlOnlyMessage(language)}</p>
          <button
            type="button"
            onClick={focusPaste}
            className="font-bold text-indigo-300 underline-offset-2 hover:underline"
          >
            {zh ? '貼上職缺文字' : 'Paste job text here'}
          </button>
        </div>
      )}

      {error && (
        <div className="upload-prompt mt-3 flex items-start gap-2 p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-sm lg:text-lg xl:text-2xl 2xl:text-3xl text-red-300 animate-fade-in">
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export { classifyJobInput };
